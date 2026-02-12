import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, Button, Loader } from "@egovernments/digit-ui-components";
import { useRegistrationForm } from "../../../hooks/useRegistrationForm";
import { getAdvocateByApplicationNumber } from "../../../services/AdvocateService";
import { useWorkflowDetails } from "../../../services/WorkflowService";
import styles from "./ApplicationStatus.module.scss";

const ApplicationStatus = ({ stateCode, path }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { formData } = useRegistrationForm();
  const tenantId = stateCode || "dev";
  
  const registrationId = location.state?.registrationId || formData.applicationId;
  const applicationNumber = location.state?.applicationNumber || formData.applicationNumber;
  
  const [advocateData, setAdvocateData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch workflow details if application number is available
  const { data: workflowData, isLoading: workflowLoading } = useWorkflowDetails({
    tenantId: tenantId,
    id: applicationNumber,
    moduleCode: "AdvocateRegistration"
  });

  useEffect(() => {
    const fetchApplicationData = async () => {
      if (applicationNumber) {
        try {
          setLoading(true);
          const advocate = await getAdvocateByApplicationNumber(applicationNumber, tenantId);
          setAdvocateData(advocate);
        } catch (error) {
          console.error("Error fetching application data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    fetchApplicationData();
  }, [applicationNumber, tenantId]);

  const handleViewMyApplication = () => {
    // Prefer registrationId, fallback to applicationNumber
    const idToUse = registrationId || applicationNumber;
    
    if (idToUse) {
      navigate(`${path}/application/${idToUse}`);
    }
  };

  const currentState = workflowData?.ProcessInstances?.[0]?.state?.state || 
                       advocateData?.workflow?.state?.state || 
                       "User Registration Requested";
  
  const statusMessage = currentState === "User Registered" 
    ? t("REGISTRATION_APPROVED")
    : currentState === "User Rejected"
    ? t("REGISTRATION_REJECTED")
    : applicationNumber && applicationNumber !== "XXXXXXXXX"
    ? t("REGISTRATION_IN_PROGRESS", { id: applicationNumber })
    : t("REGISTRATION_IN_PROGRESS", { id: "XXXXXXXXX" });

  if (loading || workflowLoading) {
    return (
      <div className={styles["application-status-container"]}>
        <Loader />
      </div>
    );
  }

  return (
    <div className={styles["application-status-container"]}>
      <div className={styles["application-status-content"]}>
        <Card className={styles["application-status-card"]} noCardStyle>
          <div className={styles["status-icon-wrap"]}>
            <span className={styles["status-icon"]} aria-hidden>
              ⏳
            </span>
          </div>
          <h1 className={styles["status-title"]}>
            {currentState === "User Registered" 
              ? t("REGISTRATION_APPROVED")
              : currentState === "User Rejected"
              ? t("REGISTRATION_REJECTED")
              : t("REGISTRATION_WAITING_APPROVAL")}
          </h1>
          <p className={styles["status-message"]}>
            {statusMessage}
          </p>
          {currentState === "User Registration Requested" && (
            <p className={styles["status-submessage"]}>
              {t("VERIFICATION_DAYS_AND_SMS")}
            </p>
          )}
          <div className={styles["status-actions"]}>
            <Button
              label={t("VIEW_MY_APPLICATION")}
              onButtonClick={handleViewMyApplication}
              onClick={handleViewMyApplication}
              className={styles["view-application-button"]}
              disabled={!registrationId && !applicationNumber}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationStatus;
