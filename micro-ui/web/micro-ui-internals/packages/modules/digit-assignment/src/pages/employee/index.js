import React from "react";
import { Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Inbox from "./Inbox";
import ApplicationDetails from "./ApplicationDetails";

const EmployeeApp = ({ path, stateCode, tenants }) => {
  const { t } = useTranslation();

  return (
    <Routes>
      <Route path={`${path}/inbox`} element={<Inbox stateCode={stateCode} tenants={tenants} />} />
      <Route path={`${path}/application/:id`} element={<ApplicationDetails stateCode={stateCode} />} />
      <Route path={path} element={
        <div className="employee-advocate-registration-home">
          <h2>{t("ADVOCATE_REGISTRATION")}</h2>
          <p>{t("ADVOCATE_REGISTRATION_EMPLOYEE_DESC")}</p>
          <a href={`/${window?.contextPath}/employee/digit-assignment/inbox`}>
            {t("ADVOCATE_REGISTRATION_INBOX")}
          </a>
        </div>
      } />
    </Routes>
  );
};

export default EmployeeApp;
