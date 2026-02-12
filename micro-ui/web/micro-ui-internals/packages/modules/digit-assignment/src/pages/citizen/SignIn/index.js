import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "@egovernments/digit-ui-components";
import { LinkButton, CardLabelError } from "@egovernments/digit-ui-react-components";
import OTPModal from "../../../components/OTPModal";
import PhoneNumberInput from "../../../components/PhoneNumberInput";
import { searchAdvocates } from "../../../services/AdvocateService";
import styles from "./SignIn.module.scss";

/** Role options for tab list – DIGIT Atom "Tabs" pattern via semantic HTML (tablist/tab) */
const ROLE_TABS = [
  { value: "judge", labelKey: "JUDGE_COURT_STAFF" },
  { value: "advocate", labelKey: "ADVOCATE_LITIGANT" },
];

const BODY_CLASS_HIDE_HEADER = "digit-assignment-signin-page";

const SignIn = ({ stateCode, tenants, path }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("advocate");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  useEffect(() => {
    document.body.classList.add(BODY_CLASS_HIDE_HEADER);
    return () => {
      document.body.classList.remove(BODY_CLASS_HIDE_HEADER);
    };
  }, []);

  const handlePhoneChange = (value) => {
    const cleanedValue = String(value || "").replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(cleanedValue);
    setError("");
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
  };

  const handleRoleKeyDown = (e, role) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRoleChange(role);
    }
  };

  const sendOTP = async (mobileNumber) => {
    try {
      setIsSendingOtp(true);
      const tenantId = stateCode || tenants?.[0]?.code || "dev";
      
      const requestBody = {
        otp: {
          mobileNumber: mobileNumber,
          tenantId: tenantId,
          userType: "citizen",
          type: "login" // Login flow
        }
      };

      // Use DIGIT standard format for OTP request
      const response = await Digit.CustomService.getResponse({
        url: "/user-otp/v1/_send",
        params: { tenantId: tenantId },
        body: requestBody,
        method: "POST",
        auth: false // OTP endpoint doesn't require authentication
      });

      // Handle different response formats from DIGIT API
      if (response?.isSuccessful === true || 
          response?.ResponseInfo?.status === "successful" || 
          response?.OtpResponse ||
          (response?.responseInfo && response?.isSuccessful !== false)) {
        return { success: true };
      }
      throw new Error("Failed to send OTP");
    } catch (error) {
      const errorMessage = error?.response?.data?.Errors?.[0]?.message || 
                          error?.response?.data?.error_description || 
                          error?.message || 
                          t("ERR_OTP_SEND_FAILED");
      return { success: false, error: errorMessage };
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOTP = async (mobileNumber, otpValue) => {
    try {
      setIsVerifyingOtp(true);
      const tenantId = stateCode || tenants?.[0]?.code || "dev";
      
      // Authenticate with OTP using DIGIT UserService
      const requestData = {
        username: mobileNumber,
        password: otpValue,
        tenantId: tenantId,
        userType: "citizen",
      };

      const { ResponseInfo, UserRequest: info, ...tokens } = await Digit.UserService.authenticate(requestData);

      if (window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE")) {
        info.tenantId = Digit.ULBService.getStateId();
      }

      // Set user in DIGIT session
      Digit.SessionStorage.set("citizen.userRequestObject", { info, ...tokens });
      Digit.UserService.setUser({ info, ...tokens });

      // Set citizen details for backward compatibility
      if (!Digit.Utils.getMultiRootTenant()) {
        let locale = JSON.parse(sessionStorage.getItem("Digit.initData"))?.value?.selectedLanguage;
        localStorage.setItem("Citizen.tenant-id", tenantId);
        localStorage.setItem("tenant-id", tenantId);
        localStorage.setItem("citizen.userRequestObject", JSON.stringify({ info, ...tokens }));
        localStorage.setItem("locale", locale);
        localStorage.setItem("Citizen.locale", locale);
        localStorage.setItem("token", tokens.access_token);
        localStorage.setItem("Citizen.token", tokens.access_token);
        localStorage.setItem("user-info", JSON.stringify({ info, ...tokens }));
        localStorage.setItem("Citizen.user-info", JSON.stringify({ info, ...tokens }));
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error?.response?.data?.error_description || 
                          error?.message || 
                          t("CS_INVALID_OTP");
      return { success: false, error: errorMessage };
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSignIn = async () => {
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");
    const phonePattern = /^[6-9][0-9]{9}$/;
    
    if (!cleanedPhoneNumber || cleanedPhoneNumber.length !== 10 || !phonePattern.test(cleanedPhoneNumber)) {
      setError(t("ERR_INVALID_MOBILE_NUMBER"));
      return;
    }
    
    setError("");
    
    // Send OTP
    const otpResult = await sendOTP(cleanedPhoneNumber);
    if (!otpResult.success) {
      setError(otpResult.error || t("ERR_OTP_SEND_FAILED"));
      return;
    }
    
    // Show OTP modal
    setShowOtpModal(true);
    setTimeLeft(30);
    setOtp("");
    setOtpError("");
  };

  const handleSignInKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSignIn();
    }
  };

  const registerHref = `${path}/register`;

  const getRoleTabClassName = (isActive) => {
    const baseClass = styles["role-tab"];
    return isActive ? `${baseClass} ${styles["active"]}` : baseClass;
  };

  const handleOtpChange = (value) => {
    setOtp(value);
    setOtpError("");
  };

  const handleVerifyOtp = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");
    if (!otp || otp.length !== 6) {
      setOtpError(t("CS_INVALID_OTP"));
      return;
    }

    try {
      const verifyResult = await verifyOTP(cleanedPhoneNumber, otp);
      if (!verifyResult.success) {
        setOtpError(verifyResult.error || t("CS_INVALID_OTP"));
        return;
      }

      // Close modal
      setShowOtpModal(false);
      setOtp("");
      setOtpError("");
      
      // Fetch user's application by mobile number
      try {
        const tenantId = stateCode || tenants?.[0]?.code || "dev";
        const response = await searchAdvocates({ mobileNumber: cleanedPhoneNumber }, tenantId);

        if (response?.advocates && response.advocates.length > 0) {
          const advocate = response.advocates[0];
          const applicationId = advocate.id || advocate.applicationNumber;

          if (applicationId) {
            // Navigate to application details
            navigate(`${path}/application/${applicationId}`);
          } else {
            // Fallback to application status if no ID found
            navigate(`${path}/application-status`);
          }
        } else {
          navigate(`${path}/application-status`);
        }
      } catch (_error) {
        navigate(`${path}/application-status`);
      }
    } catch (error) {
      setOtpError(t("CS_INVALID_OTP"));
    }
  };

  const handleResendOtp = async () => {
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");
    const otpResult = await sendOTP(cleanedPhoneNumber);
    if (otpResult.success) {
      setTimeLeft(30);
      setOtp("");
      setOtpError("");
    } else {
      setOtpError(otpResult.error || t("ERR_OTP_SEND_FAILED"));
    }
  };

  const handleCloseModal = () => {
    setShowOtpModal(false);
    setOtp("");
    setOtpError("");
    setTimeLeft(30);
  };

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  };

  // Timer countdown for OTP resend
  useEffect(() => {
    if (showOtpModal && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showOtpModal, timeLeft]);

  const isButtonDisabled = !phoneNumber || phoneNumber.length !== 10 || isSendingOtp;

  return (
    <div className={styles["advocate-registration-container"]}>
      <div className={styles["advocate-registration-content"]}>
        <div className={styles["registration-header"]}>
          <div className={styles["registration-title-wrapper"]}>
            <h1 className={styles["registration-title"]}>
              {t("SIGN_IN_TO_YOUR_ACCOUNT")}
            </h1>
            <p className={styles["registration-subtitle"]}>
              {t("WELCOME_BACK_ENTER_CREDENTIALS")}
            </p>
          </div>
        </div>

        <Card className={styles["registration-card"]} noCardStyle>
          <div
            className={styles["role-selection-tabs"]}
            role="tablist"
            aria-label={t("SIGN_IN_TO_YOUR_ACCOUNT")}
          >
            {ROLE_TABS.map((tab) => {
              const isActive = selectedRole === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="signin-tabpanel"
                  id={`role-tab-${tab.value}`}
                  className={getRoleTabClassName(isActive)}
                  onClick={() => handleRoleChange(tab.value)}
                  onKeyDown={(e) => handleRoleKeyDown(e, tab.value)}
                  tabIndex={0}
                  aria-label={t(tab.labelKey)}
                >
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>

          <div id="signin-tabpanel" className={styles["registration-content"]} role="tabpanel" aria-labelledby={`role-tab-${selectedRole}`}>
            <div className={styles["phone-input-wrapper-section"]}>
              <div className={styles["phone-input-container"]}>
                <div className={styles["phone-input-section"]}>
                  <label className={styles["phone-label"]}>
                    {t("PHONE_NO")}
                  </label>
                  <div className={styles["phone-input-wrapper"]}>
                    <PhoneNumberInput
                      name="phoneNumber"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder={t("ENTER_MOBILE_NUMBER")}
                      maxLength={10}
                      minLength={10}
                      pattern="^[6-9][0-9]{9}$"
                      countryCode="+91"
                    />
                  </div>
                  {error && <CardLabelError className={styles["error-message"]}>{error}</CardLabelError>}
                </div>
              </div>
            </div>

            <div className={styles["registration-actions"]}>
              <div className={styles["sign-in-button-wrapper"]}>
                <Button
                  label={t("SIGN_IN")}
                  onButtonClick={handleSignIn}
                  onClick={handleSignIn}
                  onKeyDown={handleSignInKeyDown}
                  disabled={isButtonDisabled}
                  className={styles["sign-in-button"]}
                  tabIndex={0}
                  aria-label={t("SIGN_IN")}
                  type="button"
                />
               
              </div>

              <div className={styles["registration-link-row"]}>
                <span className={styles["registration-link-text"]}>
                  {t("DONT_HAVE_ACCOUNT")}
                </span>
                <Button
                  label={t("REGISTER_HERE")}
                  onButtonClick={() => navigate(registerHref)}
                  onClick={() => navigate(registerHref)}
                  className={styles["register-link"]}
                  tabIndex={0}
                  aria-label={t("REGISTER_HERE")}
                  type="button"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <OTPModal
        isOpen={showOtpModal}
        onClose={handleCloseModal}
        title={t("VERIFY_YOUR_MOBILE_NUMBER")}
        instruction={`${t("OTP_INSTRUCTION")} ${formatPhoneNumber(phoneNumber)}.`}
        otp={otp}
        onOtpChange={handleOtpChange}
        otpError={otpError}
        timeLeft={timeLeft}
        onResendOtp={handleResendOtp}
        onVerify={handleVerifyOtp}
        isVerifying={isVerifyingOtp}
        isResending={isSendingOtp}
        modalId="signin-otp-modal-title"
      />
    </div>
  );
};

export default SignIn;
