/**
 * Configuration Service
 * Handles configuration values from MDMS (mocked for frontend assignment)
 * In production, this would fetch from actual MDMS service
 */

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  // Workflow configuration
  workflowEnabled: {
    litigant: true,
    advocate: true,
    advocateClerk: true
  },
  
  // Aadhaar verification
  aadhaarVerificationRequired: true,
  
  // File upload
  maxFileSize: 5 * 1024 * 1024, // 5MB in bytes
  allowedFileTypes: ['.jpg', '.png', '.jpeg', '.pdf', '.doc', '.docx'],
  
  // Field lengths
  pincodeLength: 6,
  mobileNumberLength: 10,
  barRegistrationNumberLength: 64, // Max length
  
  // Other configurations
  applicationIdPrefix: {
    advocate: 'ADVOC',
    clerk: 'ADVOC_CLERK'
  }
};

/**
 * Get configuration from MDMS (mocked)
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object>} Configuration object
 */
export const getConfig = async (tenantId) => {
  try {
    // In production, this would call MDMS service
    // For assignment, we return mocked config
    const response = await Digit.CustomService.getResponse({
      url: "/egov-mdms-service/v1/_search",
      body: {
        MdmsCriteria: {
          tenantId: tenantId,
          moduleDetails: [
            {
              moduleName: "AdvocateRegistration",
              masterDetails: [
                {
                  name: "AdvocateRegistrationConfig"
                }
              ]
            }
          ]
        }
      },
      method: "POST"
    });
    
    // Extract config from MDMS response if available
    const mdmsConfig = response?.MdmsRes?.AdvocateRegistration?.AdvocateRegistrationConfig?.[0];
    
    // Merge MDMS config with defaults
    return {
      ...DEFAULT_CONFIG,
      ...mdmsConfig
    };
  } catch (error) {
    // Return default config if MDMS fails
    if (process.env.NODE_ENV === 'development') {
      console.warn("Failed to fetch config from MDMS, using defaults:", error);
    }
    return DEFAULT_CONFIG;
  }
};

/**
 * Hook to get configuration using DIGIT MDMS hook
 * @param {string} tenantId - Tenant ID
 * @returns {Object} { data, isLoading, error }
 */
export const useConfig = (tenantId) => {
  const { data: mdmsData, isLoading, error } = Digit.Hooks.useCustomMDMS(
    tenantId,
    "AdvocateRegistration",
    [
      {
        name: "AdvocateRegistrationConfig"
      }
    ],
    {
      select: (data) => {
        const mdmsConfig = data?.AdvocateRegistration?.AdvocateRegistrationConfig?.[0];
        return {
          ...DEFAULT_CONFIG,
          ...mdmsConfig
        };
      },
      // Return default config if MDMS fails
      onError: () => {
        return DEFAULT_CONFIG;
      }
    }
  );
  
  return {
    data: mdmsData || DEFAULT_CONFIG,
    isLoading,
    error
  };
};

/**
 * Get specific config value
 * @param {string} tenantId - Tenant ID
 * @param {string} key - Config key (e.g., 'maxFileSize')
 * @returns {Promise<any>} Config value
 */
export const getConfigValue = async (tenantId, key) => {
  const config = await getConfig(tenantId);
  return config[key];
};

/**
 * Check if workflow is enabled for a role
 * @param {string} tenantId - Tenant ID
 * @param {string} role - Role ('litigant', 'advocate', 'clerk')
 * @returns {Promise<boolean>} Whether workflow is enabled
 */
export const isWorkflowEnabled = async (tenantId, role) => {
  const config = await getConfig(tenantId);
  return config.workflowEnabled?.[role] ?? true;
};

/**
 * Check if Aadhaar verification is required
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<boolean>} Whether Aadhaar verification is required
 */
export const isAadhaarVerificationRequired = async (tenantId) => {
  const config = await getConfig(tenantId);
  return config.aadhaarVerificationRequired ?? true;
};

/**
 * Get maximum file size
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<number>} Maximum file size in bytes
 */
export const getMaxFileSize = async (tenantId) => {
  const config = await getConfig(tenantId);
  return config.maxFileSize ?? (5 * 1024 * 1024);
};

/**
 * Get field length configuration
 * @param {string} tenantId - Tenant ID
 * @param {string} field - Field name ('pincode', 'mobileNumber', 'barRegistrationNumber')
 * @returns {Promise<number>} Field length
 */
export const getFieldLength = async (tenantId, field) => {
  const config = await getConfig(tenantId);
  const fieldMap = {
    pincode: 'pincodeLength',
    mobileNumber: 'mobileNumberLength',
    barRegistrationNumber: 'barRegistrationNumberLength'
  };
  return config[fieldMap[field]] ?? null;
};
