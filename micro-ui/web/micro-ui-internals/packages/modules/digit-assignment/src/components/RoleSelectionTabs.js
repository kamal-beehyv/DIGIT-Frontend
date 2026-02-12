import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@egovernments/digit-ui-components";
import styles from "./RoleSelectionTabs.module.scss";

/**
 * RoleSelectionTabs Component - Custom component for FormComposer
 * 
 * This component provides role selection tabs (Judge/Court Staff vs Advocate/Litigant)
 * for use in FormComposer forms.
 * 
 * @param {Object} props - Component props from FormComposer
 * @param {Function} props.onChange - Callback when role changes
 * @param {string} props.value - Current selected role value
 * @param {Object} props.config - Field configuration
 * @param {Object} props.formData - Current form data
 * @param {Function} props.setValue - FormComposer setValue function
 * @param {Function} props.onSelect - Callback for selection (alias for onChange)
 * @param {Function} t - Translation function
 */
const RoleSelectionTabs = ({ onChange, value, config, formData, setValue, onSelect, t: translate, ...props }) => {
  const { t } = useTranslation();
  // Get value from formData using config.key, or from value prop, or default
  const selectedRole = value || formData?.[config?.key] || formData?.selectedRole || "advocate";

  const handleRoleChange = (role) => {
    const newValue = role;
    // Update form value using setValue (FormComposer pattern)
    if (setValue && config?.key) {
      setValue(config.key, newValue, { shouldValidate: true });
    }
    // Also call onChange for Controller compatibility
    if (onChange) {
      onChange({ target: { value: newValue } });
    }
    // Call onSelect if provided (HRMS pattern)
    if (onSelect && config?.key) {
      onSelect(config.key, newValue);
    }
  };

  const handleRoleKeyDown = (e, role) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRoleChange(role);
    }
  };

  const getRoleTabClassName = (role) => {
    const baseClass = styles["role-tab"];
    return selectedRole === role ? `${baseClass} ${styles["active"]}` : baseClass;
  };

  return (
    <div className={styles["role-selection-tabs"]}>
      <Button
        label={t("JUDGE_COURT_STAFF") || "Judge/ Court Staff"}
        onButtonClick={() => handleRoleChange("judge")}
        onKeyDown={(e) => handleRoleKeyDown(e, "judge")}
        className={getRoleTabClassName("judge")}
        variation={selectedRole === "judge" ? "primary" : "secondary"}
        tabIndex={0}
        aria-label={t("JUDGE_COURT_STAFF") || "Judge/ Court Staff"}
      />
      <Button
        label={t("ADVOCATE_LITIGANT") || "Advocate/ Litigant"}
        onButtonClick={() => handleRoleChange("advocate")}
        onKeyDown={(e) => handleRoleKeyDown(e, "advocate")}
        className={getRoleTabClassName("advocate")}
        variation={selectedRole === "advocate" ? "primary" : "secondary"}
        tabIndex={0}
        aria-label={t("ADVOCATE_LITIGANT") || "Advocate/ Litigant"}
      />
    </div>
  );
};

export default RoleSelectionTabs;
