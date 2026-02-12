import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "@egovernments/digit-ui-components";
import { LabelFieldPair, CardLabel, CardLabelError, TextInput } from "@egovernments/digit-ui-react-components";
import { useRegistrationForm } from "../../../hooks/useRegistrationForm";
import styles from "./NameScreen.module.scss";

const NameScreen = ({ stateCode, tenants, path }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formData, updateFormData } = useRegistrationForm();
  const [firstName, setFirstName] = useState(formData.firstName || "");
  const [middleName, setMiddleName] = useState(formData.middleName || "");
  const [lastName, setLastName] = useState(formData.lastName || "");
  const [errors, setErrors] = useState({});

  // Load from form data if available
  useEffect(() => {
    if (formData.firstName) setFirstName(formData.firstName);
    if (formData.middleName) setMiddleName(formData.middleName);
    if (formData.lastName) setLastName(formData.lastName);
  }, [formData]);

  const handleFirstNameChange = (e) => {
    const value = e.target.value;
    setFirstName(value);
    updateFormData({ firstName: value });
    if (errors.firstName) {
      setErrors(prev => ({ ...prev, firstName: null }));
    }
  };

  const handleMiddleNameChange = (e) => {
    const value = e.target.value;
    setMiddleName(value);
    updateFormData({ middleName: value });
  };

  const handleLastNameChange = (e) => {
    const value = e.target.value;
    setLastName(value);
    updateFormData({ lastName: value });
    if (errors.lastName) {
      setErrors(prev => ({ ...prev, lastName: null }));
    }
  };

  const validate = () => {
    const validationErrors = {};
    if (!firstName || !firstName.trim()) {
      validationErrors.firstName = t("ERR_NAME_REQUIRED") || "First name is required";
    }
    if (!lastName || !lastName.trim()) {
      validationErrors.lastName = t("ERR_NAME_REQUIRED") || "Last name is required";
    }
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) {
      return;
    }
    // Update form data
    updateFormData({
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim()
    });
    navigate(`${path}/register/address`);
  };

  const isButtonDisabled = !firstName || !lastName;

  return (
    <div className={styles["name-entry-container"]}>
      <div className={styles["name-entry-content"]}>
        <Card className={styles["name-entry-card"]} noCardStyle>
          <div className={styles["name-entry-header"]}>
            <div className={styles["name-entry-title-wrapper"]}>
              <h1 className={styles["name-entry-title"]}>
                {t("ENTER_YOUR_NAME_OFFICIAL")}
              </h1>
              <p className={styles["name-entry-subtitle"]}>
                {t("NAME_ENTRY_SUBTITLE")}
              </p>
            </div>
          </div>

          <div className={styles["name-entry-form-content"]}>
            <LabelFieldPair>
              <CardLabel className={styles["form-label"]}>
                {t("FIRST_NAME")}
              </CardLabel>
              <div className={styles["field-container"]}>
                <TextInput
                  value={firstName}
                  onChange={handleFirstNameChange}
                  pattern={Digit?.Utils?.getPattern?.("Name")}
                />
              </div>
            </LabelFieldPair>

            <LabelFieldPair>
              <CardLabel className={styles["form-label"]}>
                {t("MIDDLE_NAME")} <span className={styles["optional-text"]}>({t("OPTIONAL")})</span>
              </CardLabel>
              <div className={styles["field-container"]}>
                <TextInput
                  value={middleName}
                  onChange={handleMiddleNameChange}
                  pattern={Digit?.Utils?.getPattern?.("Name")}
                />
              </div>
            </LabelFieldPair>

            <LabelFieldPair>
              <CardLabel className={styles["form-label"]}>
                {t("LAST_NAME")}
              </CardLabel>
              <div className={styles["field-container"]}>
                <TextInput
                  value={lastName}
                  onChange={handleLastNameChange}
                  pattern={Digit?.Utils?.getPattern?.("Name")}
                />
              </div>
            </LabelFieldPair>

            {errors.firstName && <CardLabelError>{errors.firstName}</CardLabelError>}
            {errors.lastName && <CardLabelError>{errors.lastName}</CardLabelError>}

            <div className={styles["name-entry-actions"]}>
              <Button
                label={t("CONTINUE")}
                onClick={handleContinue}
                isDisabled={isButtonDisabled}
                className={styles["continue-button"]}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NameScreen;
