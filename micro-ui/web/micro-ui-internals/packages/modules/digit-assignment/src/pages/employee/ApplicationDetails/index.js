import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Button, Loader, Toast } from "@egovernments/digit-ui-components";
import { WorkflowTimeline, Modal, TextInput, CardLabel, CardLabelError } from "@egovernments/digit-ui-react-components";
import { getAdvocateById } from "../../../services/AdvocateService";
import { useWorkflowDetails, updateWorkflow, createWorkflowUpdateData } from "../../../services/WorkflowService";
import { sendApprovalSMS, sendRejectionSMS } from "../../../services/NotificationService";
import styles from "./ApplicationDetails.module.scss";

const ApplicationDetails = ({ stateCode }) => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tenantId = stateCode || "dev";
  
  const [advocateData, setAdvocateData] = useState(null);
  const [individualData, setIndividualData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [toast, setToast] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: workflowData, isLoading: workflowLoading, revalidate } = useWorkflowDetails({
    tenantId: tenantId,
    id: advocateData?.applicationNumber,
    moduleCode: "AdvocateRegistration"
  });

  useEffect(() => {
    fetchApplicationData();
  }, [id, tenantId]);

  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      const advocate = await getAdvocateById(id, tenantId);
      setAdvocateData(advocate);
      
      // Fetch individual details for SMS notifications
      if (advocate?.individualId) {
        try {
          const individualResponse = await Digit.CustomService.getResponse({
            url: "/individual/v1/_search",
            body: {
              criteria: [{ id: advocate.individualId }]
            },
            method: "POST"
          });
          
          if (individualResponse?.individuals && individualResponse.individuals.length > 0) {
            setIndividualData(individualResponse.individuals[0]);
          }
        } catch (error) {
          // Individual fetch failure shouldn't block the flow
          if (process.env.NODE_ENV === 'development') {
            console.warn("Error fetching individual data:", error);
          }
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching application data:", error);
      }
      setToast({
        label: t("ERR_FETCH_APPLICATION") || "Failed to fetch application details",
        isError: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!advocateData?.applicationNumber) return;
    
    setIsProcessing(true);
    try {
      const workflowUpdate = createWorkflowUpdateData({
        businessId: advocateData.applicationNumber,
        tenantId: tenantId,
        action: "Approve",
        comment: "Application approved by Nyay Mitra"
      });

      await updateWorkflow(workflowUpdate, tenantId);
      
      // Send approval SMS notification
      try {
        const mobileNumber = individualData?.mobileNumber || advocateData?.userId || "";
        const userName = individualData?.name 
          ? `${individualData.name.givenName || ""} ${individualData.name.familyName || ""}`.trim()
          : "User";
        
        if (mobileNumber) {
          await sendApprovalSMS({
            mobileNumber: mobileNumber,
            applicationNumber: advocateData.applicationNumber,
            userName: userName
          }, tenantId);
        }
      } catch (smsError) {
        // SMS failure shouldn't block the approval flow
        if (process.env.NODE_ENV === 'development') {
          console.warn("SMS notification failed:", smsError);
        }
      }
      
      setToast({
        label: t("APPLICATION_APPROVED") || "Application approved successfully",
        isSuccess: true
      });
      
      // Refresh workflow data
      revalidate();
      
      // Navigate back to inbox after delay
      setTimeout(() => {
        navigate(`/${window?.contextPath}/employee/digit-assignment/inbox`);
      }, 2000);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error approving application:", error);
      }
      setToast({
        label: t("ERR_APPROVAL_FAILED") || "Failed to approve application",
        isError: true
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    setShowRejectModal(true);
    setRejectionReason("");
    setRejectionError("");
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason || !rejectionReason.trim()) {
      setRejectionError(t("REJECTION_REASON_REQUIRED") || "Rejection reason is required");
      return;
    }

    if (!advocateData?.applicationNumber) return;

    setIsProcessing(true);
    try {
      const workflowUpdate = createWorkflowUpdateData({
        businessId: advocateData.applicationNumber,
        tenantId: tenantId,
        action: "Reject",
        comment: rejectionReason.trim()
      });

      await updateWorkflow(workflowUpdate, tenantId);
      
      // Send rejection SMS notification
      try {
        const mobileNumber = individualData?.mobileNumber || advocateData?.userId || "";
        const userName = individualData?.name 
          ? `${individualData.name.givenName || ""} ${individualData.name.familyName || ""}`.trim()
          : "User";
        
        if (mobileNumber) {
          await sendRejectionSMS({
            mobileNumber: mobileNumber,
            applicationNumber: advocateData.applicationNumber,
            userName: userName,
            rejectionReason: rejectionReason.trim()
          }, tenantId);
        }
      } catch (smsError) {
        // SMS failure shouldn't block the rejection flow
        if (process.env.NODE_ENV === 'development') {
          console.warn("SMS notification failed:", smsError);
        }
      }
      
      setShowRejectModal(false);
      setToast({
        label: t("APPLICATION_REJECTED") || "Application rejected successfully",
        isSuccess: true
      });
      
      // Refresh workflow data
      revalidate();
      
      // Navigate back to inbox after delay
      setTimeout(() => {
        navigate(`/${window?.contextPath}/employee/digit-assignment/inbox`);
      }, 2000);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error rejecting application:", error);
      }
      setToast({
        label: t("ERR_REJECTION_FAILED") || "Failed to reject application",
        isError: true
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setRejectionReason("");
    setRejectionError("");
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleBackKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleBackClick();
    }
  };

  const handleCloseModalKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRejectCancel();
    }
  };

  const closeToast = () => {
    setTimeout(() => setToast(null), 5000);
  };

  if (loading || workflowLoading) {
    return (
      <div className={styles["application-details-loading"]}>
        <Loader />
      </div>
    );
  }

  if (!advocateData) {
    return (
      <div className={styles["application-details-not-found"]}>
        <Card>
          <p>{t("APPLICATION_NOT_FOUND") || "Application not found"}</p>
        </Card>
      </div>
    );
  }

  const currentState = workflowData?.ProcessInstances?.[0]?.state?.state || 
                       advocateData?.workflow?.state?.state || 
                       "User Registration Requested";

  const canApprove = currentState === "User Registration Requested";
  const canReject = currentState === "User Registration Requested";

  return (
    <div className={`advocate-application-details-employee ${styles["application-details-container"]}`}>
      <Card>
        <div className={styles["back-button-container"]}>
          <Button
            label={t("BACK") || "Back"}
            variation="secondary"
            onButtonClick={handleBackClick}
            onKeyDown={handleBackKeyDown}
            tabIndex={0}
            aria-label={t("BACK") || "Back"}
          />
        </div>

        <h2 className={styles["application-title"]}>{t("ADVOCATE_REVIEW_APPLICATION")}</h2>

        {/* Application Details */}
        <div className={styles["details-section"]}>
          <h3 className={styles["section-title"]}>{t("APPLICATION_DETAILS") || "Application Details"}</h3>
          <div className={styles["details-grid"]}>
            <div className={styles["detail-item"]}>
              <strong>{t("APPLICATION_ID") || "Application ID"}:</strong> {advocateData.applicationNumber}
            </div>
            <div className={styles["detail-item"]}>
              <strong>{t("BAR_REGISTRATION_NUMBER") || "Bar Registration Number"}:</strong> {advocateData.barRegistrationNumber || "N/A"}
            </div>
            <div className={styles["detail-item"]}>
              <strong>{t("USER_TYPE") || "User Type"}:</strong> {advocateData.advocateType === "ADVOCATE_CLERK" ? "Advocate Clerk" : "Advocate"}
            </div>
            <div className={styles["detail-item"]}>
              <strong>{t("STATUS") || "Status"}:</strong> {currentState}
            </div>
          </div>
        </div>

        {/* Workflow Timeline */}
        {workflowData && (
          <div className={styles["details-section"]}>
            <h3 className={styles["section-title"]}>{t("APPLICATION_TIMELINE") || "Application Timeline"}</h3>
            <WorkflowTimeline
              data={workflowData}
              moduleCode="AdvocateRegistration"
            />
          </div>
        )}

        {/* Action Buttons */}
        {canApprove || canReject ? (
          <div className={styles["action-buttons-container"]}>
            {canApprove && (
              <Button
                label={t("APPROVE") || "Approve"}
                onButtonClick={handleApprove}
                disabled={isProcessing}
                className={styles["approve-button"]}
                tabIndex={0}
                aria-label={t("APPROVE") || "Approve"}
              />
            )}
            {canReject && (
              <Button
                label={t("REJECT") || "Reject"}
                onButtonClick={handleReject}
                disabled={isProcessing}
                variation="secondary"
                className={styles["reject-button"]}
                tabIndex={0}
                aria-label={t("REJECT") || "Reject"}
              />
            )}
          </div>
        ) : (
          <div className={styles["processed-message"]}>
            <p>{t("APPLICATION_PROCESSED") || "This application has already been processed."}</p>
          </div>
        )}
      </Card>

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <Modal
          headerBarMain={<h2>{t("REJECT_APPLICATION") || "Reject Application"}</h2>}
          headerBarEnd={
            <button
              onClick={handleRejectCancel}
              onKeyDown={handleCloseModalKeyDown}
              className={styles["modal-close-button"]}
              tabIndex={0}
              aria-label={t("CS_COMMON_CLOSE") || "Close"}
            >
              ×
            </button>
          }
          actionCancelLabel={t("CANCEL") || "Cancel"}
          actionCancelOnSubmit={handleRejectCancel}
          actionSaveLabel={t("CONFIRM") || "Confirm"}
          actionSaveOnSubmit={handleRejectConfirm}
          actionSaveIsDisabled={!rejectionReason || !rejectionReason.trim() || isProcessing}
        >
          <div className={styles["modal-content"]}>
            <CardLabel className={styles["modal-label"]}>
              {t("REJECTION_REASON") || "Rejection Reason"} *
            </CardLabel>
            <TextInput
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setRejectionError("");
              }}
              placeholder={t("ENTER_REJECTION_REASON") || "Enter rejection reason"}
              multiline
              rows={4}
            />
            {rejectionError && (
              <CardLabelError className={styles["modal-error"]}>
                {rejectionError}
              </CardLabelError>
            )}
            <p className={styles["modal-hint"]}>
              {t("REJECTION_REASON_MANDATORY") || "Please provide a reason for rejection. This will be sent to the applicant via SMS."}
            </p>
          </div>
        </Modal>
      )}

      {/* Toast Notifications */}
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

export default ApplicationDetails;
