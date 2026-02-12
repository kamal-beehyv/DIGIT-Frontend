import React, { useEffect } from "react";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CustomBackButton from "../../components/CustomBackButton";
import "./citizen-app.scss";
import SignIn from "./SignIn";
import Register from "./Register";
import MobileScreen from "./MobileScreen";
import AdvocateVerification from "./AdvocateVerification";
import NameScreen from "./NameScreen";
import AddressScreen from "./AddressScreen";
import VerifyIdentity from "./VerifyIdentity";
import AadhaarEntry from "./AadhaarEntry";
import VerifyOtherId from "./VerifyOtherId";
import TermsAndConditions from "./TermsAndConditions";
import RegistrationSuccess from "./RegistrationSuccess";
import ApplicationStatus from "./ApplicationStatus";
import ApplicationDetails from "./ApplicationDetails";

const BODY_CLASS_SHOW_HEADER = "digit-assignment-header-visible";

const CitizenApp = ({ path, stateCode, tenants }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Check if current route is SignIn (empty path) - only hide back button for SignIn
  const isSignInRoute = location.pathname === path ||
                        location.pathname.endsWith(path) ||
                        location.pathname.match(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`));

  // Show header when a digit-assignment page is showing (not SignIn); hide by default
  useEffect(() => {
    if (!isSignInRoute) {
      document.body.classList.add(BODY_CLASS_SHOW_HEADER);
    } else {
      document.body.classList.remove(BODY_CLASS_SHOW_HEADER);
    }
    return () => {
      document.body.classList.remove(BODY_CLASS_SHOW_HEADER);
    };
  }, [isSignInRoute]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleBackKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleBackClick();
    }
  };

  return (
    <div 
      className="citizen-app-wrapper"
      style={{
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* Custom back button: design with left arrow + "Back" on light grey bar */}
      {!isSignInRoute && (
        <CustomBackButton
          onClick={handleBackClick}
          onKeyDown={handleBackKeyDown}
          ariaLabel={t("CS_COMMON_BACK") || "Go back"}
          labelKey="BACK"
        />
      )}
      <div 
        className="advocate-registration-citizen-app"
        style={{
          width: '100%'
        }}
      >
        <Routes>
          <Route path="" element={<SignIn stateCode={stateCode} tenants={tenants} path={path} />} />
          <Route path="register/mobile" element={<MobileScreen stateCode={stateCode} tenants={tenants} path={path} />} />
          <Route path="register/advocate-verification" element={<AdvocateVerification stateCode={stateCode} tenants={tenants} path={path} />} />
          <Route path="register/name" element={<NameScreen stateCode={stateCode} tenants={tenants} path={path} />} />
          <Route path="register/address" element={<AddressScreen stateCode={stateCode} tenants={tenants} path={path} />} />
          <Route path="register/verify-id" element={<VerifyIdentity stateCode={stateCode} tenants={tenants} path={path} />} />
          <Route path="register/verify-aadhaar" element={<AadhaarEntry stateCode={stateCode} tenants={tenants} path={path} />} />
          <Route path="register/verify-other-id" element={<VerifyOtherId stateCode={stateCode} tenants={tenants} path={path} />} />
          <Route path="register/terms-and-conditions" element={<TermsAndConditions stateCode={stateCode} tenants={tenants} path={path} />} />
          <Route path="register/success" element={<RegistrationSuccess stateCode={stateCode} tenants={tenants} path={path} />} />
          <Route path="register" element={
            <div className="register-route-wrapper">
              <div className="back-link-wrapper">
              </div>
              <Register stateCode={stateCode} tenants={tenants} path={path} />
            </div>
          } />
          <Route path="application-status" element={<ApplicationStatus stateCode={stateCode} path={path} />} />
          <Route path="application/:id" element={<ApplicationDetails stateCode={stateCode} path={path} />} />
        </Routes>
      </div>
    </div>
  );
};

export default CitizenApp;
