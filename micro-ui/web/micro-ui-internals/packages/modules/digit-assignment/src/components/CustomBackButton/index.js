import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./CustomBackButton.module.scss";

/**
 * Custom Back button matching design: left-pointing arrow + "Back" text
 * on a light grey bar. Used in citizen app and ApplicationDetails.
 */
const CustomBackButton = ({
  onClick,
  onKeyDown,
  ariaLabel,
  labelKey = "BACK",
  className = "",
}) => {
  const { t } = useTranslation();
  const label = labelKey ? (typeof t === "function" ? t(labelKey) : t(labelKey)) || "Back" : "Back";
  const a11yLabel = ariaLabel || label;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
    onKeyDown?.(e);
  };

  return (
    <div className={`${styles["back-button-bar"]} ${className}`.trim()} data-digit-back="true">
      <button
        type="button"
        className={styles["back-button"]}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label={a11yLabel}
      >
        <span className={styles["back-arrow"]} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" focusable="false">
            <path d="M15 4l-8 8 8 8V4z" />
          </svg>
        </span>
        <span className={styles["back-label"]}>{label}</span>
      </button>
    </div>
  );
};

export default CustomBackButton;
