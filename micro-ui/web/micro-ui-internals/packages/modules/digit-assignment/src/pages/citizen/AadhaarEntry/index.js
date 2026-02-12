import React, { useState, useEffect, Fragment, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "@egovernments/digit-ui-components";
import { TextInput, CardLabelError } from "@egovernments/digit-ui-react-components";
import OTPModal from "../../../components/OTPModal";
import { useRegistrationForm } from "../../../hooks/useRegistrationForm";
import styles from "./AadhaarEntry.module.scss";

const AadhaarEntry = ({ stateCode, tenants, path }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formData, updateFormData } = useRegistrationForm();
  
  // Initialize from form data if available
  const existingAadhaar = formData.aadhaarNumber || "";
  const [segment1, setSegment1] = useState(existingAadhaar.slice(0, 4) || "");
  const [segment2, setSegment2] = useState(existingAadhaar.slice(4, 8) || "");
  const [segment3, setSegment3] = useState(existingAadhaar.slice(8, 12) || "");
  const [error, setError] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [otpError, setOtpError] = useState("");

  const segment1Ref = useRef(null);
  const segment2Ref = useRef(null);
  const segment3Ref = useRef(null);

  const handleSegment1Change = (e) => {
    const v = String((e && e.target && e.target.value) || "").replace(/\D/g, "").slice(0, 4);
    setSegment1(v);
    setError("");
    // Auto-focus next input when 4 digits are entered
    if (v.length === 4 && segment2Ref.current) {
      segment2Ref.current.focus();
    }
  };

  const handleSegment2Change = (e) => {
    const v = String((e && e.target && e.target.value) || "").replace(/\D/g, "").slice(0, 4);
    setSegment2(v);
    setError("");
    // Auto-focus next input when 4 digits are entered
    if (v.length === 4 && segment3Ref.current) {
      segment3Ref.current.focus();
    }
  };

  const handleSegment3Change = (e) => {
    const v = String((e && e.target && e.target.value) || "").replace(/\D/g, "").slice(0, 4);
    setSegment3(v);
    setError("");
  };


  const aadhaarNumber = `${segment1}${segment2}${segment3}`;
  const isAadhaarValid = aadhaarNumber.length === 12;

  const handleGetOtp = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isAadhaarValid) {
      setError(t("ERR_INVALID_AADHAAR"));
      return;
    }
    // Save Aadhaar number to form data
    updateFormData({ 
      aadhaarNumber: aadhaarNumber,
      identityType: "aadhaar"
    });
    setError("");
    setShowOtpModal(true);
    setTimeLeft(30);
    setOtp("");
    setOtpError("");
    // Note: This is a dummy implementation per assignment requirements
    // In production, this would call UIDAI API to send OTP
  };

  const handleOtpChange = (value) => {
    setOtp(value);
    setOtpError("");
  };

  const handleVerifyOtp = () => {
    if (!otp || otp.length !== 6) {
      setOtpError(t("CS_INVALID_OTP"));
      return;
    }
    // Update form data with verification status
    // Note: This is a dummy implementation per assignment requirements
    updateFormData({ 
      aadhaarNumber: aadhaarNumber,
      aadhaarVerified: true,
      identityType: "aadhaar"
    });
    setShowOtpModal(false);
    setOtp("");
    setOtpError("");
    navigate(`${path}/register/terms-and-conditions`);
  };

  const handleResendOtp = () => {
    setTimeLeft(30);
    setOtp("");
    setOtpError("");
  };

  const handleCloseModal = () => {
    setShowOtpModal(false);
    setOtp("");
    setOtpError("");
    setTimeLeft(30);
  };

  useEffect(() => {
    if (showOtpModal && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showOtpModal, timeLeft]);

  // Attach keydown handlers for backspace navigation
  useEffect(() => {
    const segment2Input = segment2Ref.current;
    const segment3Input = segment3Ref.current;

    const handleSegment2KeyDown = (e) => {
      if (e.key === "Backspace" && e.target.value.length === 0) {
        e.preventDefault();
        if (segment1Ref.current) {
          segment1Ref.current.focus();
        }
      }
    };

    const handleSegment3KeyDown = (e) => {
      if (e.key === "Backspace" && e.target.value.length === 0) {
        e.preventDefault();
        if (segment2Ref.current) {
          segment2Ref.current.focus();
        }
      }
    };

    if (segment2Input) {
      segment2Input.addEventListener("keydown", handleSegment2KeyDown);
    }
    if (segment3Input) {
      segment3Input.addEventListener("keydown", handleSegment3KeyDown);
    }

    return () => {
      if (segment2Input) {
        segment2Input.removeEventListener("keydown", handleSegment2KeyDown);
      }
      if (segment3Input) {
        segment3Input.removeEventListener("keydown", handleSegment3KeyDown);
      }
    };
  }, []);

  const maskedMobile = "+91******XXXX";

  return (
    <Fragment>
      <div className={styles["aadhaar-entry-container"]}>
        <div className={styles["aadhaar-entry-content"]}>
          

          <Card className={styles["aadhaar-entry-card"]} noCardStyle>
            <div className={styles["aadhaar-entry-card-header"]}>
              <h2 className={styles["aadhaar-entry-card-title"]}>
                {t("ENTER_YOUR_AADHAAR_NUMBER")}
              </h2>
              <p className={styles["aadhaar-entry-card-description"]}>
                {t("AADHAAR_12_DIGIT_INSTRUCTION")}
              </p>
            </div>
            <div className={styles["aadhaar-entry-form-content"]}>
              <div className={styles["aadhaar-segments"]}>
                <div className={styles["aadhaar-segment-wrap"]}>
                  <TextInput
                    name="aadhaar1"
                    value={segment1}
                    onChange={handleSegment1Change}
                    maxLength={4}
                    placeholder=""
                    inputRef={segment1Ref}
                  />
                </div>
                <div className={styles["aadhaar-segment-wrap"]}>
                  <TextInput
                    name="aadhaar2"
                    value={segment2}
                    onChange={handleSegment2Change}
                    maxLength={4}
                    placeholder=""
                    inputRef={segment2Ref}
                  />
                </div>
                <div className={styles["aadhaar-segment-wrap"]}>
                  <TextInput
                    name="aadhaar3"
                    value={segment3}
                    onChange={handleSegment3Change}
                    maxLength={4}
                    placeholder=""
                    inputRef={segment3Ref}
                  />
                </div>
              </div>
              {error && (
                <div className={styles["error-wrap"]}>
                  <CardLabelError>{error}</CardLabelError>
                </div>
              )}
              <div className={styles["aadhaar-entry-actions"]}>
                <Button
                  label={t("GET_OTP")}
                  onClick={handleGetOtp}
                  className={styles["get-otp-button"]}
                  type="button"
                  isDisabled={!isAadhaarValid}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <OTPModal
        isOpen={showOtpModal}
        onClose={handleCloseModal}
        title={t("VERIFY_YOUR_AADHAAR")}
        instruction={`${t("AADHAAR_OTP_INSTRUCTION")} ${maskedMobile}.`}
        otp={otp}
        onOtpChange={handleOtpChange}
        otpError={otpError}
        timeLeft={timeLeft}
        onResendOtp={handleResendOtp}
        onVerify={handleVerifyOtp}
        usePortal={true}
        modalId="aadhaar-otp-modal-title"
      />
    </Fragment>
  );
};

export default AadhaarEntry;
