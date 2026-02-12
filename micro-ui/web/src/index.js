import React, { useEffect, useState, lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { Hooks } from "@egovernments/digit-ui-libraries";
// import { BrowserRouter } from "react-router-dom";

import { initLibraries } from "@egovernments/digit-ui-libraries";

import "../packages/css/dist/index.css";
import "../micro-ui-internals/packages/modules/digit-assignment/dist/index.css";
import "./styles/digit-assignment/digit-overrides.css";

window.Digit = window.Digit || {};
window.Digit.Hooks = Hooks;
const DigitUILazy = lazy(() =>
  import("@egovernments/digit-ui-module-core").then((module) => {
    if (module.initCoreComponents) module.initCoreComponents();
    return { default: module.DigitUI };
  })
);


const enabledModules = ["assignment", "Workbench", "Utilities", "Campaign"];

const initTokens = (stateCode) => {
  const userType = window.sessionStorage.getItem("userType") || process.env.REACT_APP_USER_TYPE || "CITIZEN";
  const token = window.localStorage.getItem("token") || process.env[`REACT_APP_${userType}_TOKEN`];

  const citizenInfo = window.localStorage.getItem("Citizen.user-info");
  const citizenTenantId = window.localStorage.getItem("Citizen.tenant-id") || stateCode;
  const employeeInfo = window.localStorage.getItem("Employee.user-info");
  const employeeTenantId = window.localStorage.getItem("Employee.tenant-id");

  const userTypeInfo = userType === "CITIZEN" || userType === "QACT" ? "citizen" : "employee";
  window.Digit.SessionStorage.set("user_type", userTypeInfo);
  window.Digit.SessionStorage.set("userType", userTypeInfo);

  if (userType !== "CITIZEN") {
    window.Digit.SessionStorage.set("User", {
      access_token: token,
      info: userType !== "CITIZEN" ? JSON.parse(employeeInfo) : citizenInfo,
    });
  }

  window.Digit.SessionStorage.set("Citizen.tenantId", citizenTenantId);

  if (employeeTenantId && employeeTenantId.length) {
    window.Digit.SessionStorage.set("Employee.tenantId", employeeTenantId);
  }
};

const initDigitUI = () => {
  // globalConfigs loaded from index.html script (e.g. https://s3.ap-south-1.amazonaws.com/egov-dev-assets/globalConfigs.js)
  // provides CONTEXT_PATH ("digit-ui"), STATE_LEVEL_TENANT_ID ("dev"), etc.
  window.contextPath = window?.globalConfigs?.getConfig("CONTEXT_PATH") || "digit-ui";

  const stateCode = window?.globalConfigs?.getConfig("STATE_LEVEL_TENANT_ID") || process.env.REACT_APP_STATE_LEVEL_TENANT_ID || "dev";

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<>

    <MainApp stateCode={stateCode} enabledModules={enabledModules} />

  </>);
};

const MainApp = ({ stateCode, enabledModules }) => {
  const [isReady, setIsReady] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    initLibraries().then(async () => {
      try {
        
        const { initWorkbenchComponents } = await import("@egovernments/digit-ui-module-workbench")
        initWorkbenchComponents();
        const { initDigitAssignmentComponents } = await import("@egovernments/digit-ui-module-digit-assignment");
        initDigitAssignmentComponents();
      } catch (error) {
        console.log("Error loading modules:", error);
        // Continue without modules if they fail to load
      }
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    initTokens(stateCode);
    setLoaded(true);
  }, [stateCode, isReady]);

  if (!loaded) {
    return <div>Loading...</div>;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {window.Digit && (
        <DigitUILazy stateCode={stateCode} enabledModules={enabledModules} allowedUserTypes={["employee", "citizen"]} defaultLanding="citizen" />
      )}
    </Suspense>
  );
};

initDigitUI();
