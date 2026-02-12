import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button, Loader } from "@egovernments/digit-ui-components";
import { CheckBox, Toast } from "@egovernments/digit-ui-react-components";
import { useRegistrationForm } from "../../../hooks/useRegistrationForm";
import { 
  createAdvocate, 
  generateAdvocateApplicationNumber, 
  generateClerkApplicationNumber 
} from "../../../services";
import { createWorkflowData, startWorkflow, autoApproveWorkflow } from "../../../services/WorkflowService";
import { sendAutoApprovalSMS } from "../../../services/NotificationService";
import styles from "./TermsAndConditions.module.scss";

const TermsAndConditions = ({ stateCode, tenants, path }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formData, updateFormData, clearFormData } = useRegistrationForm();
  const [accepted, setAccepted] = useState(formData.termsAccepted || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  
  const tenantId = stateCode || tenants?.[0]?.code || "dev";

  const closeToast = () => {
    setTimeout(() => setToast(null), 5000);
  };

  const handleProceed = async () => {
    if (!accepted) return;
    
    setIsSubmitting(true);
    setToast(null);
    
    try {
      // Validate required fields
      if (!formData.mobileNumber || !formData.firstName || !formData.lastName) {
        throw new Error(t("ERR_MISSING_REQUIRED_FIELDS") || "Please complete all required fields");
      }

      // Step 1: Create Individual record
      const individualData = {
        tenantId: tenantId,
        name: {
          givenName: formData.firstName,
          familyName: formData.lastName,
          otherNames: formData.middleName || undefined
        },
        gender: "OTHER", // Default, can be enhanced
        dateOfBirth: null, // Can be added if required
        mobileNumber: formData.mobileNumber,
        address: formData.address ? [{
          tenantId: tenantId,
          doorNo: formData.address.doorNumber,
          buildingName: formData.address.locality,
          street: formData.address.locality,
          locality: {
            code: formData.address.locality,
            name: formData.address.locality
          },
          city: formData.address.city?.code || formData.address.city,
          pincode: formData.address.pincode,
          district: formData.address.district?.code || formData.address.district,
          state: formData.address.state?.code || formData.address.state,
          latitude: formData.address.latitude,
          longitude: formData.address.longitude
        }] : []
      };

      const individualResponse = await Digit.CustomService.getResponse({
        url: "/individual/v1/_create",
        body: {
          individuals: [individualData]
        },
        method: "POST"
      });

      if (!individualResponse?.individuals || individualResponse.individuals.length === 0) {
        throw new Error(t("ERR_INDIVIDUAL_CREATION_FAILED") || "Failed to create individual record");
      }

      const individualId = individualResponse.individuals[0].id;

      // Step 2: Create User record
      const userData = {
        userName: formData.mobileNumber,
        name: `${formData.firstName} ${formData.middleName ? formData.middleName + " " : ""}${formData.lastName}`,
        mobileNumber: formData.mobileNumber,
        tenantId: tenantId,
        type: "CITIZEN",
        roles: [{
          code: formData.role === "advocate" ? "ADVOCATE" : 
                formData.role === "clerk" ? "ADVOCATE_CLERK" : "CITIZEN",
          name: formData.role === "advocate" ? "Advocate" : 
                formData.role === "clerk" ? "Advocate Clerk" : "Citizen"
        }]
      };

      const userResponse = await Digit.CustomService.getResponse({
        url: "/user/citizen/_create",
        body: {
          UserRequest: userData
        },
        method: "POST"
      });

      if (!userResponse?.UserRequest?.uuid) {
        throw new Error(t("ERR_USER_CREATION_FAILED") || "Failed to create user record");
      }

      const userId = userResponse.UserRequest.uuid;

      // Step 3: Generate application number
      let applicationNumber;
      if (formData.role === "clerk") {
        applicationNumber = await generateClerkApplicationNumber(tenantId);
      } else {
        applicationNumber = await generateAdvocateApplicationNumber(tenantId);
      }

      // Check if user is a litigant and has Aadhaar verification
      const isLitigant = formData.role === "litigant";
      const isAadhaarVerified = formData.aadhaarVerified === true;
      const shouldAutoApprove = isLitigant && isAadhaarVerified;

      // Determine initial workflow state
      const initialWorkflowState = shouldAutoApprove ? "User Registered" : "User Registration Requested";

      // Step 4: Create Advocate record
      const advocateData = {
        tenantId: tenantId,
        userId: userId,
        individualId: individualId,
        applicationNumber: applicationNumber,
        barRegistrationNumber: formData.barRegistrationNumber || null,
        advocateType: formData.role === "advocate" ? "ADVOCATE" : 
                     formData.role === "clerk" ? "ADVOCATE_CLERK" : "ADVOCATE",
        isActive: true,
        documents: formData.barCouncilIdFileStoreId ? [{
          documentType: "BAR_COUNCIL_ID",
          fileStoreId: formData.barCouncilIdFileStoreId,
          documentUid: null
        }] : [],
        workflow: {
          action: shouldAutoApprove ? "Approve" : "Register",
          state: {
            state: initialWorkflowState
          }
        }
      };

      const advocateResponse = await createAdvocate(advocateData, tenantId);

      if (!advocateResponse?.advocates || advocateResponse.advocates.length === 0) {
        throw new Error(t("ERR_ADVOCATE_CREATION_FAILED") || "Failed to create advocate record");
      }

      const advocateId = advocateResponse.advocates[0].id;

      // Step 5: Handle workflow based on user type
      if (shouldAutoApprove) {
        // Auto-approve workflow for litigants with Aadhaar verification
        try {
          await autoApproveWorkflow({
            businessId: applicationNumber,
            tenantId: tenantId,
            comment: "Auto-approved: Litigant verified via Aadhaar"
          });

          // Send auto-approval SMS notification
          try {
            await sendAutoApprovalSMS({
              mobileNumber: formData.mobileNumber,
              applicationNumber: applicationNumber,
              userName: `${formData.firstName} ${formData.lastName}`.trim()
            }, tenantId);
          } catch (smsError) {
            // SMS failure shouldn't block the flow
            if (process.env.NODE_ENV === 'development') {
              console.warn("SMS notification failed:", smsError);
            }
          }
        } catch (workflowError) {
          // Workflow auto-approval failure shouldn't block the flow
          if (process.env.NODE_ENV === 'development') {
            console.warn("Workflow auto-approval failed:", workflowError);
          }
        }
      } else {
        // Start normal workflow for advocates/clerks
        const workflowData = createWorkflowData({
          businessId: applicationNumber,
          tenantId: tenantId,
          action: "Register",
          comment: "Advocate registration application submitted"
        });

        try {
          await startWorkflow(workflowData, tenantId);
        } catch (workflowError) {
          // Workflow start is optional, log but don't fail
          if (process.env.NODE_ENV === 'development') {
            console.warn("Workflow start failed:", workflowError);
          }
        }
      }

      // Update form data with application details
      updateFormData({
        termsAccepted: true,
        applicationNumber: applicationNumber,
        applicationId: advocateId,
        individualId: individualId,
        userId: userId,
        workflowState: initialWorkflowState
      });

      // Show success toast with appropriate message
      const successMessage = shouldAutoApprove
        ? t("REGISTRATION_AUTO_APPROVED") || "Registration approved successfully! You can now log in."
        : t("REGISTRATION_SUCCESS") || "Registration submitted successfully";
      
      setToast({
        label: successMessage,
        isSuccess: true
      });
      closeToast();

      // Navigate to application status page
      setTimeout(() => {
        navigate(`${path}/application-status`, {
          state: {
            registrationId: advocateId,
            applicationNumber: applicationNumber
          }
        });
      }, 1500);

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Registration submission error:", error);
      }
      setToast({
        label: error.message || t("ERR_REGISTRATION_FAILED") || "Registration failed. Please try again.",
        isError: true
      });
      closeToast();
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles["tnc-container"]}>
      <div className={styles["tnc-content"]}>
        <h1 className={styles["tnc-title"]}>
          {t("TERMS_AND_CONDITIONS")}
        </h1>

        <p className={styles["tnc-intro"]}>
          {t("TNC_INTRO")}
        </p>

        <div className={styles["tnc-scroll"]}>
          <div className={styles["tnc-body"]}>
            <section>
              <h3>1. User Eligibility</h3>
              <ul>
                <li><strong>Age:</strong> You must be of legal age to enter into binding contracts.</li>
                <li><strong>Legal Capacity:</strong> You must have the legal capacity to use this platform.</li>
              </ul>
            </section>
            <section>
              <h3>2. User Registration and Account</h3>
              <ul>
                <li><strong>Account Creation:</strong> You are responsible for providing accurate information during registration.</li>
                <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</li>
                <li><strong>Account Termination:</strong> We reserve the right to suspend or terminate your account for violations of these terms.</li>
              </ul>
            </section>
            <section>
              <h3>3. Platform Services</h3>
              <ul>
                <li><strong>Service Description:</strong> The platform provides users with a convenient and efficient way to file court cases and manage case-related proceedings online.</li>
                <li><strong>Limitations:</strong> Service availability may be subject to change, and we do not guarantee uninterrupted access.</li>
              </ul>
            </section>
            <section>
              <h3>4. User Conduct</h3>
              <ul>
                <li><strong>Prohibited Conduct:</strong> You agree not to engage in any illegal activities, misuse of intellectual property, or abuse of platform resources.</li>
                <li><strong>Intellectual Property:</strong> All content on the platform is protected by intellectual property laws. You may not reproduce or distribute content without permission.</li>
              </ul>
            </section>
            <section>
              <h3>5. Fees and Payments</h3>
              <ul>
                <li><strong>Payment Terms:</strong> Applicable fees and payment terms are as specified on the platform.</li>
                <li><strong>Refund Policy:</strong> Refund policy applies as per the platform guidelines and applicable laws.</li>
              </ul>
            </section>
            <section>
              <h3>6. Privacy Policy</h3>
              <ul>
                <li><strong>Data Collection and Use:</strong> We collect, use, and protect your data in accordance with our privacy policy and applicable laws.</li>
                <li><strong>Data Sharing:</strong> We may share your data with authorized third parties as necessary for service provision.</li>
                <li><strong>Data Security:</strong> We implement reasonable security measures to protect your data, but cannot guarantee absolute security.</li>
              </ul>
            </section>
            <section>
              <h3>7. Disclaimer of Warranties</h3>
              <ul>
                <li><strong>No Warranties:</strong> The platform is provided "as is" without warranties of any kind, express or implied.</li>
                <li><strong>Limitation of Liability:</strong> We disclaim warranties to the extent permitted by law and shall not be liable for indirect or consequential damages.</li>
              </ul>
            </section>
            <section>
              <h3>8. Indemnification</h3>
              <ul>
                <li><strong>User Indemnification:</strong> You agree to indemnify the platform for claims or losses arising from your use or violation of these terms.</li>
              </ul>
            </section>
            <section>
              <h3>9. Governing Law and Jurisdiction</h3>
              <ul>
                <li><strong>Governing Law:</strong> These terms are governed by the laws of {t("TNC_JURISDICTION")}.</li>
                <li><strong>Jurisdiction:</strong> Disputes shall be subject to the exclusive jurisdiction of the courts in {t("TNC_JURISDICTION")}.</li>
              </ul>
            </section>
            <section>
              <h3>10. Amendments</h3>
              <ul>
                <li><strong>Modifications:</strong> We may modify these terms at any time.</li>
                <li><strong>Notification:</strong> Continued use after notification constitutes acceptance of the modified terms.</li>
              </ul>
            </section>
            <section>
              <h3>11. Severability</h3>
              <ul>
                <li><strong>Severability:</strong> If any provision is held invalid, the remaining provisions shall continue in full force and effect.</li>
              </ul>
            </section>
            <section>
              <h3>Additional Considerations:</h3>
              <ul>
                <li><strong>Dispute Resolution:</strong> Mechanisms for resolving disputes may apply as per applicable laws.</li>
                <li><strong>Force Majeure:</strong> We are not liable for failure due to circumstances beyond our control.</li>
                <li><strong>Third-Party Services:</strong> Use of third-party services may be subject to their terms and conditions.</li>
              </ul>
            </section>
          </div>
        </div>

        <div className={styles["tnc-footer"]}>
          <div className={styles["tnc-checkbox-wrap"]}>
            <CheckBox
              checked={accepted}
              onChange={(e) => {
                const checked = e.target.checked;
                setAccepted(checked);
                updateFormData({ termsAccepted: checked });
              }}
              label={t("I_ACCEPT_TERMS")}
            />
          </div>
          {isSubmitting ? (
            <Loader />
          ) : (
            <Button
              label={t("PROCEED")}
              onButtonClick={handleProceed}
              onClick={handleProceed}
              className={styles["proceed-button"]}
              isDisabled={!accepted || isSubmitting}
            />
          )}
        </div>
      </div>
      {toast && (
        <Toast
          label={toast.label}
          isDleteBtn={true}
          onClose={() => setToast(null)}
          error={toast.isError}
          warning={false}
        />
      )}
    </div>
  );
};

export default TermsAndConditions;
