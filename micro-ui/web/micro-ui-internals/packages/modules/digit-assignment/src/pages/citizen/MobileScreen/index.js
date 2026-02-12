import React, { useState, useEffect, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  Button
} from "@egovernments/digit-ui-components";
import {
  CardLabel,
  CardLabelError,
  CardSubHeader,
  LabelFieldPair
} from "@egovernments/digit-ui-react-components";
import OTPModal from "../../../components/OTPModal";
import PhoneNumberInput from "../../../components/PhoneNumberInput";
import { useRegistrationForm } from "../../../hooks/useRegistrationForm";
import styles from "./MobileScreen.module.scss";

const MobileScreen = ({ stateCode, tenants, path }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formData, updateFormData } = useRegistrationForm();
  const [phoneNumber, setPhoneNumber] = useState(formData.mobileNumber || "");
  const [error, setError] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Load phone number from form data if available
  useEffect(() => {
    if (formData.mobileNumber) {
      setPhoneNumber(formData.mobileNumber);
    }
  }, [formData.mobileNumber]);

  const handlePhoneChange = (value) => {
    const cleanedValue = String(value || "").replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(cleanedValue);
    setError("");
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
          type: "register" // Registration flow
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
      // Format 1: { responseInfo: {...}, isSuccessful: true }
      // Format 2: { ResponseInfo: { status: "successful" }, OtpResponse: {...} }
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
      // Verify OTP by attempting to authenticate
      const response = await Digit.CustomService.getResponse({
        url: "/user/oauth/token",
        body: {
          username: mobileNumber,
          password: otpValue,
          tenantId: stateCode || tenants?.[0]?.code || "dev",
          userType: "citizen",
          grant_type: "password"
        },
        method: "POST",
        auth: false
      });
      
      if (response?.access_token || response?.UserRequest) {
        return { success: true };
      }
      throw new Error("Invalid OTP");
    } catch (error) {
      return { success: false, error: error.message || t("CS_INVALID_OTP") };
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleContinue = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");
    const phonePattern = /^[6-9][0-9]{9}$/;
    
    if (!cleanedPhoneNumber || cleanedPhoneNumber.length !== 10 || !phonePattern.test(cleanedPhoneNumber)) {
      setError(t("ERR_INVALID_MOBILE_NUMBER"));
      return;
    }
    
    // Save mobile number to form data
    updateFormData({ mobileNumber: cleanedPhoneNumber });
    
    // Send OTP
    const otpResult = await sendOTP(cleanedPhoneNumber);
    if (!otpResult.success) {
      setError(otpResult.error || t("ERR_OTP_SEND_FAILED"));
      return;
    }
    
    setShowOtpModal(true);
    setTimeLeft(30);
  };

  const handleOtpChange = (value) => {
    setOtp(value);
    setOtpError("");
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError(t("CS_INVALID_OTP"));
      return;
    }
    
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");
    const verifyResult = await verifyOTP(cleanedPhoneNumber, otp);
    
    if (!verifyResult.success) {
      setOtpError(verifyResult.error || t("CS_INVALID_OTP"));
      return;
    }
    
    // Update form data with OTP verification status
    updateFormData({ 
      mobileNumber: cleanedPhoneNumber,
      otpVerified: true 
    });
    
    setShowOtpModal(false);
    setOtp("");
    
    // Navigate based on role (if advocate, go to advocate-verification, else name)
    const role = formData.role || "advocate";
    if (role === "advocate" || role === "clerk") {
      navigate(`${path}/register/advocate-verification`);
    } else {
      navigate(`${path}/register/name`);
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

  // Timer countdown
  useEffect(() => {
    if (showOtpModal && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showOtpModal, timeLeft]);

  const formatPhoneNumber = (phone) => {
    const cleaned = String(phone || "").replace(/\D/g, "");
    if (!cleaned || cleaned.length !== 10) return "";
    return `+91******${cleaned.slice(-4)}`;
  };

  const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");
  const phonePattern = /^[6-9][0-9]{9}$/;
  const isPhoneValid = cleanedPhoneNumber.length === 10 && phonePattern.test(cleanedPhoneNumber);
  const isButtonDisabled = !isPhoneValid;

  return (
    <Fragment>
      <div className={styles["mobile-number-container"]}>
        <div className={styles["mobile-number-content"]}>
          <Card className={styles["mobile-number-card"]} noCardStyle>
            <div className={styles["mobile-number-header"]}>
              <div className={styles["mobile-number-title-wrapper"]}>
                <h1 className={styles["mobile-number-title"]}>
                  {t("DIGIT_ASSIGNMENT_PLEASE_ENTER_YOUR_MOBILE_NUMBER")}
                </h1>
                <CardSubHeader className={styles["mobile-number-subtitle"]}>
                  {t("DIGIT_ASSIGNMENT_MOBILE_NUMBER_SUBTITLE")}
                </CardSubHeader>
              </div>
            </div>
            <div className={styles["mobile-number-form-content"]}>
              <LabelFieldPair className={styles["mobile-input-section"]}>
                <CardLabel className={styles["mobile-label"]}>
                  {t("MOBILE_NO")}
                </CardLabel>
                <div className={styles["mobile-input-wrapper"]}>
                  <PhoneNumberInput
                    name="mobileNumber"
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
              </LabelFieldPair>

              <div className={styles["mobile-number-actions"]}>
                <Button
                  label={t("CONTINUE")}
                  onClick={handleContinue}
                  disabled={isButtonDisabled || isSendingOtp}
                  className={styles["continue-button"]}
                />
              </div>
            </div>
          </Card>
        </div>
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
        resendDisabled={timeLeft > 0}
        modalId="otp-modal-title"
      />
    </Fragment>
  );
};

export default MobileScreen;
