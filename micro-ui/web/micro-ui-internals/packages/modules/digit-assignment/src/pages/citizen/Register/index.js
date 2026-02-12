import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "@egovernments/digit-ui-components";
import { useRegistrationForm } from "../../../hooks/useRegistrationForm";
import RoleOptionGroup from "../../../components/RoleOptionGroup";
import styles from "./Register.module.scss";

const Register = ({ stateCode, tenants, path }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formData, updateFormData } = useRegistrationForm();
  const [selectedRole, setSelectedRole] = useState(formData.role || "advocate");

  // Load role from form data if available
  useEffect(() => {
    if (formData.role) {
      setSelectedRole(formData.role);
    }
  }, [formData.role]);

  const roleOptions = [
    {
      value: "litigant",
      name: t("IM_A_LITIGANT"),
      description: t("LITIGANT_DESCRIPTION")
    },
    {
      value: "advocate",
      name: t("IM_AN_ADVOCATE"),
      description: t("ADVOCATE_DESCRIPTION")
    },
    {
      value: "clerk",
      name: t("IM_AN_ADVOCATES_CLERK"),
      description: t("CLERK_DESCRIPTION")
    }
  ];

  const handleRoleChange = (value) => {
    setSelectedRole(value);
    updateFormData({ role: value });
  };

  const handleContinue = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const targetPath = `${path}/register/mobile`;
    navigate(targetPath);
  };

  return (
    <div className={styles["register-page-wrapper"]}>
      <div className={styles["advocate-registration-container"]}>
        <div className={styles["advocate-registration-content"]}>
          <Card className={styles["registration-card"]} noCardStyle>
            <div className={styles["registration-content"]}>
              <div className={styles["registration-header"]}>
                <div className={styles["registration-title-wrapper"]}>
                  <h1 className={styles["registration-title"]}>
                    {t("TELL_US_ABOUT_YOURSELF")}
                  </h1>
                  <p className={styles["registration-subtitle"]}>
                    {t("REGISTER_SUBTITLE")}
                  </p>
                </div>
              </div>

              <div className={styles["role-options-container"]}>
                <RoleOptionGroup
                  options={roleOptions}
                  value={selectedRole}
                  onChange={handleRoleChange}
                  name="role"
                  ariaLabel={t("TELL_US_ABOUT_YOURSELF")}
                  idPrefix="role"
                />
              </div>

              <div className={styles["registration-actions"]}>
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
    </div>
  );
};

export default Register;
