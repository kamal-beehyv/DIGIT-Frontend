import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Button, Loader } from "@egovernments/digit-ui-components";
import { WorkflowTimeline } from "@egovernments/digit-ui-react-components";
import { getAdvocateById, getAdvocateByApplicationNumber } from "../../../services/AdvocateService";
import { useWorkflowDetails } from "../../../services/WorkflowService";
import CustomBackButton from "../../../components/CustomBackButton";
import styles from "./ApplicationDetails.module.scss";

const ApplicationDetails = ({ stateCode, path }) => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tenantId = stateCode || "dev";
  
  const [advocateData, setAdvocateData] = useState(null);
  const [individualData, setIndividualData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch workflow details
  const { data: workflowData, isLoading: workflowLoading } = useWorkflowDetails({
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
      // Try to fetch by ID first, then by application number
      let advocate = await getAdvocateById(id, tenantId);
      if (!advocate && id && !id.includes("-")) {
        // If ID looks like application number, try that
        advocate = await getAdvocateByApplicationNumber(id, tenantId);
      }
      
      if (!advocate) {
        throw new Error("Application not found");
      }
      
      setAdvocateData(advocate);
      
      // Fetch individual details if available
      if (advocate.individualId) {
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
          console.error("Error fetching individual data:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching application data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    if (!address || address.length === 0) return "N/A";
    const addr = address[0];
    const parts = [
      addr.doorNo,
      addr.buildingName,
      addr.street,
      addr.locality?.name,
      addr.city,
      addr.district,
      addr.state,
      addr.pincode
    ].filter(Boolean);
    return parts.join(", ") || "N/A";
  };

  const formatName = (name) => {
    if (!name) return "N/A";
    const parts = [name.givenName, name.middleName, name.familyName].filter(Boolean);
    return parts.join(" ") || "N/A";
  };

  const currentState = workflowData?.ProcessInstances?.[0]?.state?.state || 
                       advocateData?.workflow?.state?.state || 
                       "User Registration Requested";

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleBackKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleBackClick();
    }
  };

  const handleHomeClick = () => {
    navigate(`/${window?.contextPath}/citizen`);
  };

  const handleHomeKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleHomeClick();
    }
  };

  if (loading || workflowLoading) {
    return (
      <div className={`advocate-application-details ${styles["application-details-loading"]}`}>
        <Loader />
      </div>
    );
  }

  if (!advocateData) {
    return (
      <div className={`advocate-application-details ${styles["application-details-not-found"]}`}>
        <Card>
          <h2>{t("ADVOCATE_APPLICATION_DETAILS")}</h2>
          <p>{t("APPLICATION_NOT_FOUND") || "Application not found"}</p>
          <Button
            label={t("TAKE_ME_HOME") || "Take me Home"}
            onButtonClick={handleHomeClick}
            tabIndex={0}
            aria-label={t("TAKE_ME_HOME") || "Take me Home"}
            onKeyDown={handleHomeKeyDown}
            className={styles["take-me-home-button"]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={`advocate-application-details ${styles["application-details-container"]}`}>
      <Card>

        <h2 className={styles["application-title"]}>{t("MY_APPLICATION") || "My Application"}</h2>

        {/* Application Status */}
        <div className={styles["status-section"]}>
          <div className={styles["status-content"]}>
            <div>
              <strong>{t("APPLICATION_ID") || "Application ID"}:</strong> {advocateData.applicationNumber}
            </div>
            <div>
              <strong>{t("STATUS") || "Status"}:</strong> {currentState}
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className={styles["details-section"]}>
          <h3 className={styles["section-title"]}>{t("PERSONAL_DETAILS") || "Personal Details"}</h3>
          <div className={styles["details-grid"]}>
            <div className={styles["detail-item"]}>
              <strong>{t("NAME") || "Name"}:</strong> {individualData ? formatName(individualData.name) : "N/A"}
            </div>
            <div className={styles["detail-item"]}>
              <strong>{t("MOBILE_NUMBER") || "Mobile Number"}:</strong> {individualData?.mobileNumber || advocateData.userId || "N/A"}
            </div>
            {advocateData.barRegistrationNumber && (
              <div className={styles["detail-item"]}>
                <strong>{t("BAR_REGISTRATION_NO") || "Bar Registration Number"}:</strong> {advocateData.barRegistrationNumber}
              </div>
            )}
            {individualData?.address && individualData.address.length > 0 && (
              <div className={`${styles["detail-item"]} ${styles["detail-item-full-width"]}`}>
                <strong>{t("ADDRESS") || "Address"}:</strong> {formatAddress(individualData.address)}
              </div>
            )}
          </div>
        </div>

        {/* Identity Verification */}
        {advocateData.individualId && (
          <div className={styles["details-section"]}>
            <h3 className={styles["section-title"]}>{t("IDENTITY_VERIFICATION") || "Identity Verification"}</h3>
            <div className={styles["detail-item"]}>
              <strong>{t("ID_TYPE") || "ID Type"}:</strong> {individualData?.identifiers?.[0]?.type || "N/A"}
            </div>
          </div>
        )}

        {/* Documents */}
        {advocateData.documents && advocateData.documents.length > 0 && (
          <div className={styles["details-section"]}>
            <h3 className={styles["section-title"]}>{t("DOCUMENTS") || "Documents"}</h3>
            <div>
              {advocateData.documents.map((doc, index) => (
                <div key={index} className={styles["document-item"]}>
                  <strong>{doc.documentType || "Document"}:</strong> {doc.fileStoreId || "N/A"}
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Action Button */}
        <div className={styles["action-button-container"]}>
          <Button
            label={t("TAKE_ME_HOME") || "Take me Home"}
            onButtonClick={handleHomeClick}
            tabIndex={0}
            aria-label={t("TAKE_ME_HOME") || "Take me Home"}
            onKeyDown={handleHomeKeyDown}
            className={styles["take-me-home-button"]}
          />
        </div>
      </Card>
    </div>
  );
};

export default ApplicationDetails;
