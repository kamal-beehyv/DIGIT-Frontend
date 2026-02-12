import React from "react";
import { useLocation } from "react-router-dom";
import CitizenApp from "./pages/citizen";
import EmployeeApp from "./pages/employee";
import AdvocateRegistrationCard from "./components/AdvocateRegistrationCard";
import RoleSelectionTabs from "./components/RoleSelectionTabs";
import CustomCitizenTopBar from "./components/CustomCitizenTopBar";
import enTranslations from "./locales/en.json";
// Import global CSS (non-module CSS files)
import "./pages/citizen/citizen-app.scss";
// Note: CSS module files (.module.scss) should be imported in their respective components, not here

/**
 * Advocate Registration Module - Citizen & Employee (Nyay Mitra) flows.
 * Implements advocate registration, application status, and approval workflow.
 */
const AdvocateRegistrationModule = ({ stateCode, userType, tenants, moduleCode }) => {
  try {
    // Base path for this module (React Router v6: derive from location)
    const location = useLocation();
    const pathname = location?.pathname || window.location.pathname;
    const pathMatch = pathname.match(/(.*\/(?:citizen|employee)\/(?:digit-assignment|advocateregistration))/i);
    const path = pathMatch ? pathMatch[1] : `/${window?.contextPath || 'digit-ui'}/citizen/${(moduleCode || 'digit-assignment').toLowerCase()}`;

    if (userType === "employee") {
      return <EmployeeApp path={path} stateCode={stateCode} tenants={tenants} />;
    }

    return <CitizenApp path={path} stateCode={stateCode} tenants={tenants} />;
  } catch (error) {
    console.error("Error in AdvocateRegistrationModule:", error);
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Error loading module</h2>
        <p>{error?.message || "Unknown error occurred"}</p>
        <pre style={{ textAlign: "left", fontSize: "12px", overflow: "auto", maxHeight: "300px" }}>
          {error?.stack}
        </pre>
      </div>
    );
  }
};

const componentsToRegister = {
  "Digit-AssignmentModule": AdvocateRegistrationModule, // Register as Digit-AssignmentModule to match module code "Digit-Assignment"
  AdvocateRegistrationCard,
  RoleSelectionTabs, // Custom component for FormComposer
  CustomCitizenTopBar, // Custom TopBar with Support link for citizen pages
};

const initDigitAssignmentComponents = () => {
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Digit-Assignment] Registered component: ${key}`);
    }
  });
  
  // Verify registration
  const registeredModule = Digit.ComponentRegistryService.getComponent("Digit-AssignmentModule");
  if (registeredModule) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Digit-Assignment] Module successfully registered and verified`);
    }
  } else {
    console.error(`[Digit-Assignment] Module registration failed - component not found in registry`);
  }
  
  // Register translations from en.json file
  if (Digit?.LocalizationService?.updateResources && enTranslations) {
    try {
      const locale = Digit.Utils.getDefaultLanguage() || "en";
      // Convert JSON object to array format expected by updateResources
      // Format: [{ code: "KEY", message: "Translation", module: "module-name" }]
      const messages = Object.entries(enTranslations).map(([code, message]) => ({
        code,
        message,
        module: "digit-assignment"
      }));
      
      // updateResources handles locale region internally
      Digit.LocalizationService.updateResources(locale, messages);
    } catch (error) {
      console.error(`[Digit-Assignment] Error registering translations:`, error);
    }
  }
};

export { initDigitAssignmentComponents };
