import { EmployeeModuleCard } from "@egovernments/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";

const ROLES = {
  NYAY_MITRA: ["EMPLOYEE", "SUPERUSER", "EMPLOYEE_COMMON"],
};

const AdvocateRegistrationCard = () => {
  if (!Digit.Utils?.didEmployeeHasAtleastOneRole?.(Object.values(ROLES).flat())) {
    return null;
  }
  const { t } = useTranslation();

  const links = [
    {
      label: t("ADVOCATE_REGISTRATION_INBOX") || "Registration Inbox",
      link: `/${window?.contextPath}/employee/digit-assignment/inbox`,
      roles: ROLES.NYAY_MITRA,
    },
  ].filter((link) => (link?.roles?.length ? Digit.Utils.didEmployeeHasAtleastOneRole(link.roles) : true));

  const propsForModuleCard = {
    Icon: "AccountBalance",
    moduleName: t("ADVOCATE_REGISTRATION") || "Advocate Registration",
    kpis: [],
    links,
  };
  return <EmployeeModuleCard {...propsForModuleCard} />;
};

export default AdvocateRegistrationCard;
