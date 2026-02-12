/**
 * Registration Form State Management Hook
 * Persists form data across registration steps using sessionStorage
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "advocate_registration_form_data";

/**
 * Hook to manage registration form state
 * @returns {Object} { formData, setFormData, updateFormData, clearFormData, getFormData }
 */
export const useRegistrationForm = () => {
  const [formData, setFormDataState] = useState(() => {
    // Initialize from sessionStorage if available
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading form data from sessionStorage:", error);
    }
    return getInitialFormData();
  });

  // Save to sessionStorage whenever formData changes
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error("Error saving form data to sessionStorage:", error);
    }
  }, [formData]);

  /**
   * Set complete form data
   * @param {Object} data - Complete form data object
   */
  const setFormData = useCallback((data) => {
    setFormDataState(data);
  }, []);

  /**
   * Update specific fields in form data
   * @param {Object} updates - Partial form data object
   */
  const updateFormData = useCallback((updates) => {
    setFormDataState((prev) => ({
      ...prev,
      ...updates
    }));
  }, []);

  /**
   * Clear all form data
   */
  const clearFormData = useCallback(() => {
    const initial = getInitialFormData();
    setFormDataState(initial);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing form data from sessionStorage:", error);
    }
  }, []);

  /**
   * Get current form data
   * @returns {Object} Current form data
   */
  const getFormData = useCallback(() => {
    return formData;
  }, [formData]);

  return {
    formData,
    setFormData,
    updateFormData,
    clearFormData,
    getFormData
  };
};

/**
 * Get initial form data structure
 * @returns {Object} Initial form data
 */
const getInitialFormData = () => {
  return {
    // Role selection
    role: null, // "advocate", "litigant", "clerk"
    
    // Mobile number and OTP
    mobileNumber: null,
    otpVerified: false,
    
    // Advocate verification (only for advocates)
    stateOfRegistration: null,
    barRegistrationNumber: null,
    barCouncilIdFile: null,
    barCouncilIdFileStoreId: null,
    
    // Personal details
    firstName: null,
    middleName: null,
    lastName: null,
    
    // Address details
    address: {
      pincode: null,
      state: null,
      district: null,
      city: null,
      locality: null,
      doorNumber: null,
      latitude: null,
      longitude: null,
      addressLine1: null
    },
    
    // Identity verification
    identityType: null, // "aadhaar" or "other"
    aadhaarNumber: null,
    aadhaarVerified: false,
    otherIdFile: null,
    otherIdFileStoreId: null,
    
    // Terms and conditions
    termsAccepted: false,
    
    // Application details (set after submission)
    applicationNumber: null,
    applicationId: null,
    individualId: null,
    userId: null
  };
};

/**
 * Get form data from sessionStorage (static method)
 * @returns {Object|null} Form data or null
 */
export const getStoredFormData = () => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading form data from sessionStorage:", error);
  }
  return null;
};

/**
 * Clear form data from sessionStorage (static method)
 */
export const clearStoredFormData = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing form data from sessionStorage:", error);
  }
};
