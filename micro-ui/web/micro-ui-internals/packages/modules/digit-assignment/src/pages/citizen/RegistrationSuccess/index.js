import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "@egovernments/digit-ui-components";
import styles from "./RegistrationSuccess.module.scss";

const RegistrationSuccess = ({ stateCode, tenants, path }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleFileACase = () => {
    navigate(`${path}/file-case`);
  };

  const handleJoinACase = () => {
    navigate(`${path}/join-case`);
  };

  return (
    <div className={styles["success-container"]}>
      <div className={styles["success-content"]}>
        <Card className={styles["success-card"]} noCardStyle>
          <div className={styles["success-icon-wrap"]}>
            <svg
              className={styles["success-icon"]}
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Outer circle - darker green */}
              <circle cx="40" cy="40" r="38" fill="#2E7D32" />
              {/* Inner circle - lighter green */}
              <circle cx="40" cy="40" r="32" fill="#34C759" />
              {/* Checkmark */}
              <path
                d="M26 40L36 50L54 32"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className={styles["success-title"]}>
            {t("REGISTERED_SUCCESSFULLY")}
          </h1>
          <p className={styles["success-subtext"]}>
            {t("CAN_NOW_FILE_OR_JOIN_CASE")}
          </p>
          <div className={styles["success-actions"]}>
            <Button
              label={t("FILE_A_CASE")}
              onButtonClick={handleFileACase}
              className={styles["file-case-button"]}
            />
            <Button
              label={t("JOIN_A_CASE")}
              onButtonClick={handleJoinACase}
              className={styles["join-case-button"]}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
