import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./CustomCitizenTopBar.module.scss";

/** Default Emblem of India (national emblem) - can be overridden via HEADER_EMBLEM_URL config */
const DEFAULT_EMBLEM_URL =
  "https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg";

const CustomCitizenTopBar = ({
  t,
  stateInfo,
  toggleSidebar,
  isSidebarOpen,
  handleLogout,
  userDetails,
  CITIZEN,
  cityDetails,
  mobileView,
  userOptions,
  handleUserDropdownSelection,
  logoUrl,
  logoUrlWhite,
  showLanguageChange = true,
}) => {
  const { t: translate } = useTranslation();
  const getLabel = (key, fallback) => (typeof t === "function" ? t(key) : translate(key)) || fallback;

  const emblemUrl =
    window?.globalConfigs?.getConfig("HEADER_EMBLEM_URL") ||
    stateInfo?.logoUrlWhite ||
    DEFAULT_EMBLEM_URL;

  const handleSupportClick = () => {
    const supportUrl = window?.globalConfigs?.getConfig("SUPPORT_URL") || "#";
    if (supportUrl !== "#") {
      window.open(supportUrl, "_blank");
    }
  };

  const handleSupportKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSupportClick();
    }
  };

  const ChangeLanguage = Digit.ComponentRegistryService?.getComponent("ChangeLanguage");

  const languageOption = showLanguageChange && ChangeLanguage ? (
    <div className={styles["language-option"]}>
      <span className={styles["globe-icon"]} aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
        </svg>
      </span>
      <ChangeLanguage dropdown={true} />
    </div>
  ) : null;

  const rightSection = (
    <div className={styles["header-actions"]}>
      {languageOption}
      <button
        type="button"
        className={styles["support-link"]}
        onClick={handleSupportClick}
        onKeyDown={handleSupportKeyDown}
        tabIndex={0}
        aria-label={getLabel("CS_COMMON_SUPPORT", "Support")}
      >
        {getLabel("SUPPORT", "Support")}
      </button>
    </div>
  );

  return (
    <header className={styles["design-header"]} data-header="digit-assignment" role="banner">
      <div className={styles["design-header-inner"]}>
        <div className={styles["header-left"]}>
          <div className={styles["emblem-wrapper"]}>
            <img
              src={emblemUrl}
              alt={getLabel("HEADER_EMBLEM_ALT", "Emblem of India")}
              className={styles["emblem-img"]}
            />
          </div>
        </div>
        <div className={styles["header-right"]}>{rightSection}</div>
      </div>
    </header>
  );
};

export default CustomCitizenTopBar;
