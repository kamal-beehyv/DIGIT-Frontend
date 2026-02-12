import React, { useState, Fragment, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, Button, FileUpload } from "@egovernments/digit-ui-components";
import {
  LabelFieldPair,
  CardLabel,
  TextInput,
  CardLabelError,
  Dropdown,
} from "@egovernments/digit-ui-react-components";
import { useRegistrationForm } from "../../../hooks/useRegistrationForm";
import { useStates } from "../../../services/MDMSService";
import { useConfig } from "../../../services/ConfigService";
import { DUMMY_STATES } from "../../../constants/dummyLocationData";
import styles from "./AdvocateVerification.module.scss";

const ACCEPTED_FILE_TYPES = ".jpg,.png,.jpeg,.pdf,.doc,.docx";

const normalizeFileInput = (filesOrEvent) => {
  if (!filesOrEvent) return [];
  
  if (filesOrEvent.target && filesOrEvent.target.files) {
    return Array.from(filesOrEvent.target.files);
  }
  
  if (Array.isArray(filesOrEvent)) {
    return filesOrEvent;
  }
  
  return [filesOrEvent];
};

const isImageFile = (file) => {
  return file && file.type && file.type.startsWith("image/");
};

const revokeObjectURL = (url) => {
  // Only revoke object URLs (blob: URLs), not regular HTTP/HTTPS URLs
  if (url && typeof url === "string" && url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      // Ignore errors when revoking
      console.warn("Error revoking object URL:", error);
    }
  }
};

const clearError = (setErrors, fieldName) => {
  setErrors((prev) => {
    if (prev[fieldName]) {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    }
    return prev;
  });
};

const ImagePreview = memo(({ previewUrl, onRemove, className, t }) => {
  if (!previewUrl) return null;

  return (
    <div className={className}>
      <div className={styles["upload-preview-inner"]}>
        <img 
          src={previewUrl} 
          alt={t("PREVIEW_IMAGE") || "Preview"} 
          className={styles["upload-preview-img"]}
        />
        <button
          type="button"
          className={styles["upload-preview-remove"]}
          onClick={onRemove}
          aria-label={t("REMOVE_IMAGE") || "Remove image"}
        >
          ×
        </button>
      </div>
    </div>
  );
});

const FormHeader = ({ className }) => {
  const { t } = useTranslation();
  
  return (
    <div className={className}>
      <div className={styles["registration-title-wrapper"]}>
        <h1 className={styles["registration-title"]}>
          {t("ADVOCATE_VERIFICATION")}
        </h1>
        <p className={styles["registration-subtitle"]}>
          {t("ADVOCATE_VERIFICATION_SUBTITLE")}
        </p>
      </div>
    </div>
  );
};

const AdvocateVerification = ({ stateCode, tenants, path }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formData, updateFormData } = useRegistrationForm();
  const tenantId = stateCode || tenants?.[0]?.code || "dev";
  
  // Fetch states from MDMS
  const { data: statesData, isLoading: statesLoading } = useStates(tenantId);
  
  // Fetch configuration for file size limits
  const { data: config } = useConfig(tenantId);
  const maxFileSize = config?.maxFileSize || (5 * 1024 * 1024); // Default 5MB
  
  // Initialize form fields from stored form data
  const [stateOfRegistration, setStateOfRegistration] = useState(
    formData.stateOfRegistration || null
  );
  const [barRegistrationNumber, setBarRegistrationNumber] = useState(
    formData.barRegistrationNumber || ""
  );
  const [fileStoreId, setFileStoreId] = useState(
    formData.barCouncilIdFileStoreId || null
  );
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const initializedRef = useRef(false);
  
  // Initialize preview URL from existing form data
  useEffect(() => {
    // Only initialize once on mount
    if (initializedRef.current) return;
    
    const initializePreview = async () => {
      // If there's a file object in formData, create preview URL from it
      if (formData.barCouncilIdFile && isImageFile(formData.barCouncilIdFile)) {
        const objectUrl = URL.createObjectURL(formData.barCouncilIdFile);
        setPreviewUrl(objectUrl);
        setUploadedFiles([formData.barCouncilIdFile]);
        initializedRef.current = true;
        return;
      }
      
      // If there's a fileStoreId (and it's not "pending"), fetch the file URL
      if (fileStoreId && fileStoreId !== "pending" && typeof Digit !== "undefined" && Digit.UploadServices) {
        try {
          const { data: { fileStoreIds } = {} } = await Digit.UploadServices.Filefetch([fileStoreId], tenantId);
          if (fileStoreIds && fileStoreIds.length > 0 && fileStoreIds[0]?.url) {
            const fileUrl = fileStoreIds[0].url;
            // Check if it's an image file by URL extension
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const isImage = imageExtensions.some(ext => fileUrl.toLowerCase().includes(ext));
            if (isImage) {
              setPreviewUrl(fileUrl);
            }
          }
        } catch (error) {
          console.error("Error fetching file URL:", error);
        }
      }
      initializedRef.current = true;
    };
    
    initializePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount
  
  // Convert MDMS states data to dropdown options; use shared dummy states when API returns no data (same as AddressScreen)
  const stateOptions = useMemo(() => {
    if (!statesData || statesData.length === 0) return DUMMY_STATES;
    return statesData.map(state => ({
      code: state.code || state.name,
      name: state.name || state.code
    }));
  }, [statesData]);
  const handleStateChange = useCallback((selected) => {
    setStateOfRegistration(selected);
    updateFormData({ stateOfRegistration: selected });
    clearError(setErrors, "stateOfRegistration");
  }, [updateFormData]);

  const handleBarNumberChange = useCallback((e) => {
    const value = (e && e.target && e.target.value != null) ? e.target.value : "";
    setBarRegistrationNumber(value);
    updateFormData({ barRegistrationNumber: value });
    clearError(setErrors, "barRegistrationNumber");
  }, [updateFormData]);

  const handleFileUpload = useCallback((filesOrEvent) => {
    const files = normalizeFileInput(filesOrEvent);
    
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file size from configuration
      if (file.size > maxFileSize) {
        setUploadError(t("ERR_FILE_SIZE_EXCEEDED"));
        return;
      }
      
      // Store old preview URL for cleanup
      const oldPreviewUrl = previewUrl;
      
      // Create new preview URL first (if image) to prevent flickering
      // This ensures there's always a valid URL during the transition
      let newPreviewUrl = null;
      if (isImageFile(file)) {
        newPreviewUrl = URL.createObjectURL(file);
      }
      
      // Update all states together to minimize re-renders
      setUploadedFiles(files);
      setFileStoreId("pending");
      setUploadError("");
      setPreviewUrl(newPreviewUrl);
      clearError(setErrors, "uploadBarCouncilId");
      
      // Store file reference in form data
      updateFormData({ 
        barCouncilIdFile: file,
        barCouncilIdFileStoreId: "pending"
      });
      
      // Clean up old preview URL after new one is set (using requestAnimationFrame for smooth transition)
      if (oldPreviewUrl && oldPreviewUrl !== newPreviewUrl) {
        requestAnimationFrame(() => {
          revokeObjectURL(oldPreviewUrl);
        });
      }
    } else {
      const oldPreviewUrl = previewUrl;
      setPreviewUrl(null);
      setUploadedFiles([]);
      setFileStoreId(null);
      setUploadError("");
      clearError(setErrors, "uploadBarCouncilId");
      updateFormData({ 
        barCouncilIdFile: null,
        barCouncilIdFileStoreId: null
      });
      // Clean up after state update
      if (oldPreviewUrl) {
        requestAnimationFrame(() => {
          revokeObjectURL(oldPreviewUrl);
        });
      }
    }
  }, [previewUrl, updateFormData, t]);

  const handleRemovePreview = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Store old preview URL for cleanup
    const oldPreviewUrl = previewUrl;
    
    // Clear all states immediately
    setPreviewUrl(null);
    setUploadedFiles([]);
    setFileStoreId(null);
    setUploadError("");
    clearError(setErrors, "uploadBarCouncilId");
    
    // Update form data
    updateFormData({ 
      barCouncilIdFile: null,
      barCouncilIdFileStoreId: null
    });
    
    // Clean up preview URL after state update
    if (oldPreviewUrl) {
      requestAnimationFrame(() => {
        revokeObjectURL(oldPreviewUrl);
      });
    }
    
    // Also trigger handleFileUpload with empty array to reset FileUpload component
    handleFileUpload([]);
  }, [previewUrl, updateFormData, handleFileUpload]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const hasFileSelected = useMemo(() => {
    return (uploadedFiles && uploadedFiles.length > 0) || (fileStoreId && fileStoreId !== "pending");
  }, [uploadedFiles, fileStoreId]);

  const validate = useCallback(() => {
    const validationErrors = {};
    
    if (!stateOfRegistration) {
      validationErrors.stateOfRegistration = t("REQUIRED_FIELD");
    }
    
    if (!(barRegistrationNumber && barRegistrationNumber.trim())) {
      validationErrors.barRegistrationNumber = t("REQUIRED_FIELD");
    }
    
    if (!hasFileSelected) {
      validationErrors.uploadBarCouncilId = t("PLEASE_UPLOAD_BAR_COUNCIL_ID");
    }
    
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [stateOfRegistration, barRegistrationNumber, hasFileSelected, t]);

  const handleContinue = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    
    if (!validate()) return;
    
    navigate(`${path}/register/name`);
  }, [validate, navigate, path]);

  return (
    <Fragment>
      <div className={styles["advocate-registration-container"]}>
        <div className={styles["advocate-registration-content"]}>
          <Card className={styles["registration-card"]} noCardStyle>
            <FormHeader
              className={styles["registration-header"]}
            />

            <div className={styles["registration-content"]}>
              <div className={styles["advocate-verification-form-content"]}>
                <LabelFieldPair>
                  <CardLabel className={styles["form-label"]}>
                    {t("STATE_OF_REGISTRATION")}
                  </CardLabel>
                  <div className={styles["field-container"]} data-state-registration-dropdown="true">
                    <Dropdown
                      t={t}
                      option={stateOptions}
                      optionKey="name"
                      select={handleStateChange}
                      selected={stateOfRegistration}
                      className={styles["state-dropdown"]}
                      placeholder={t("SELECT_STATE")}
                      showArrow={true}
                      disabled={statesLoading}
                    />
                    {errors.stateOfRegistration && (
                      <CardLabelError>{errors.stateOfRegistration}</CardLabelError>
                    )}
                  </div>
                </LabelFieldPair>

                <LabelFieldPair>
                  <CardLabel className={styles["form-label"]}>
                    {t("BAR_REGISTRATION_NUMBER")}
                  </CardLabel>
                  <div className={styles["field-container"]}>
                    <TextInput
                      name="barRegistrationNumber"
                      value={barRegistrationNumber}
                      onChange={handleBarNumberChange}
                      placeholder={t("ENTER_BAR_REGISTRATION_NUMBER")}
                    />
                    {errors.barRegistrationNumber && (
                      <CardLabelError>{errors.barRegistrationNumber}</CardLabelError>
                    )}
                  </div>
                </LabelFieldPair>

                <LabelFieldPair>
                  <CardLabel className={styles["form-label"]}>
                    {t("UPLOAD_BAR_COUNCIL_ID")}
                  </CardLabel>
                  <div className={styles["field-container"]}>
                    <div className={styles["file-upload-field"]}>
                      <FileUpload
                        uploadedFiles={uploadedFiles}
                        variant="uploadField"
                        onUpload={handleFileUpload}
                        iserror={uploadError || errors.uploadBarCouncilId}
                        accept={ACCEPTED_FILE_TYPES}
                        message={t("NO_FILES_UPLOADED")}
                      />
                    </div>
                    <ImagePreview
                      previewUrl={previewUrl}
                      onRemove={handleRemovePreview}
                      className={styles["upload-preview-wrap"]}
                      t={t}
                    />
                    {errors.uploadBarCouncilId && (
                      <CardLabelError>{errors.uploadBarCouncilId}</CardLabelError>
                    )}
                  </div>
                </LabelFieldPair>

                <div className={styles["advocate-verification-actions"]}>
                  <Button
                    label={t("CONTINUE")}
                    onClick={handleContinue}
                    className={styles["continue-button"]}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Fragment>
  );
};

export default AdvocateVerification;
