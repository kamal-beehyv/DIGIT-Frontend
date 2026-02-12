import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "@egovernments/digit-ui-components";
import { useRegistrationForm } from "../../../hooks/useRegistrationForm";
import RoleOptionGroup from "../../../components/RoleOptionGroup";
import styles from "./VerifyIdentity.module.scss";

const VerifyIdentity = ({ stateCode, tenants, path }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formData, updateFormData } = useRegistrationForm();
  const [verificationMethod, setVerificationMethod] = useState(
    formData.identityType || "aadhaar"
  );
  
  // Load from form data if available
  useEffect(() => {
    if (formData.identityType) {
      setVerificationMethod(formData.identityType);
    }
  }, [formData.identityType]);

  const options = [
    {
      value: "aadhaar",
      name: `${t("AADHAAR")} ${t("RECOMMENDED")}`,
      description: t("AADHAAR_DESCRIPTION"),
    },
    {
      value: "other_id",
      name: t("OTHER_ID"),
      description: t("OTHER_ID_DESCRIPTION"),
    },
  ];

  const handleContinue = () => {
    // Save identity type to form data
    updateFormData({ identityType: verificationMethod });
    if (verificationMethod === "aadhaar") {
      navigate(`${path}/register/verify-aadhaar`);
    } else {
      navigate(`${path}/register/verify-other-id`);
    }
  };

  const handleVerificationMethodChange = (value) => {
    setVerificationMethod(value);
    updateFormData({ identityType: value });
  };

  return (
    <div className={styles["verify-identity-container"]}>
      <div className={styles["verify-identity-content"]}>
        <Card className={styles["verify-identity-card"]} noCardStyle>
          <div className={styles["verify-identity-header"]}>
            <div className={styles["verify-identity-title-wrapper"]}>
              <h1 className={styles["verify-identity-title"]}>
                {t("VERIFY_YOUR_IDENTITY")}
              </h1>
              <p className={styles["verify-identity-subtitle"]}>
                {t("VERIFY_IDENTITY_SUBTITLE")}
              </p>
            </div>
          </div>

          <div className={styles["verify-identity-form-content"]}>
            <div className={styles["options-container"]}>
              <RoleOptionGroup
                options={options}
                value={verificationMethod}
                onChange={handleVerificationMethodChange}
                name="verificationMethod"
                ariaLabel={t("VERIFY_YOUR_IDENTITY")}
                idPrefix="verification"
              />
            </div>

            <div className={styles["verify-identity-actions"]}>
              <Button
                label={t("CONTINUE")}
                onClick={handleContinue}
                className={styles["continue-button"]}
                type="button"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerifyIdentity;
