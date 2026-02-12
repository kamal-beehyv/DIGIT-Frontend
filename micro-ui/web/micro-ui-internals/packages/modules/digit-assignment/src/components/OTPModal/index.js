import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@egovernments/digit-ui-components";
import { PopUp } from "@egovernments/digit-ui-react-components";
import { OTPInput, CardLabelError } from "@egovernments/digit-ui-react-components";
import CloseIcon from "../CloseIcon";
import styles from "./OTPModal.module.scss";

const OTPModal = ({
  isOpen,
  onClose,
  title,
  instruction,
  otp,
  onOtpChange,
  otpError,
  timeLeft,
  onResendOtp,
  onVerify,
  isVerifying = false,
  isResending = false,
  usePortal = false,
  resendDisabled = false,
  modalId = "otp-modal-title",
}) => {
  const { t } = useTranslation();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflowY = "hidden";
      return () => {
        document.body.style.overflowY = "auto";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isVerifyDisabled = !otp || otp.length !== 6;
  const canResend = timeLeft === 0 && !resendDisabled;

  const formatTime = (seconds) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  const modalContent = (
    <div
      className={styles["otp-modal-overlay"]}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalId}
    >
      <div
        className={styles["otp-modal-card"]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles["otp-modal-header"]}>
          <h2 id={modalId} className={styles["otp-modal-title"]}>
            {title}
          </h2>
          <button
            type="button"
            className={styles["otp-close-button"]}
            onClick={onClose}
            aria-label={t("CS_COMMON_CLOSE")}
          >
            <CloseIcon fill="currentColor" />
          </button>
        </div>
        <div className={styles["otp-modal-content"]}>
          <p className={styles["otp-instruction"]}>
            {instruction}
          </p>
          <div className={styles["otp-input-container"]}>
            <OTPInput length={6} onChange={onOtpChange} value={otp} />
          </div>
          {otpError && (
            <div className={styles["otp-error"]}>
              {typeof otpError === "string" ? (
                <CardLabelError>{otpError}</CardLabelError>
              ) : (
                otpError
              )}
            </div>
          )}
          <div className={styles["otp-resend-container"]}>
            {timeLeft > 0 && (
              <span className={styles["otp-timer"]}>
                {t("REQUEST_NEW_OTP_IN")} {formatTime(timeLeft)}
              </span>
            )}
            <button
              type="button"
              className={styles["resend-otp-button"]}
              onClick={onResendOtp}
              disabled={timeLeft > 0 || resendDisabled || isResending}
            >
              {t("RESEND_OTP")}
            </button>
          </div>
        </div>
        <div className={styles["otp-modal-footer"]}>
          <Button
            label={t("VERIFY")}
            onButtonClick={(e) => {
              if (onVerify) onVerify(e);
            }}
            onClick={(e) => {
              if (onVerify) onVerify(e);
            }}
            disabled={isVerifyDisabled || isVerifying}
            className={styles["verify-button"]}
            type="button"
            tabIndex={0}
          />
        </div>
      </div>
    </div>
  );

  if (usePortal) {
    return createPortal(modalContent, document.body);
  }

  return <PopUp>{modalContent}</PopUp>;
};

export default OTPModal;
