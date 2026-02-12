/**
 * MDMS Service
 * Handles master data management service calls
 */

/**
 * Get advocate types from MDMS
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Array>} Array of advocate types
 */
export const getAdvocateTypes = async (tenantId) => {
  try {
    const response = await Digit.CustomService.getResponse({
      url: "/egov-mdms-service/v1/_search",
      body: {
        MdmsCriteria: {
          tenantId: tenantId,
          moduleDetails: [
            {
              moduleName: "AdvocateRegistry",
              masterDetails: [
                {
                  name: "AdvocateType"
                }
              ]
            }
          ]
        }
      },
      method: "POST"
    });
    
    return response?.MdmsRes?.AdvocateRegistry?.AdvocateType || [];
  } catch (error) {
    // Return default advocate types if MDMS fails
    return [
      { code: "ADVOCATE", name: "Advocate", isActive: true },
      { code: "ADVOCATE_CLERK", name: "Advocate Clerk", isActive: true }
    ];
  }
};

/**
 * Get states from MDMS
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Array>} Array of states
 */
export const getStates = async (tenantId) => {
  try {
    const response = await Digit.CustomService.getResponse({
      url: "/egov-mdms-service/v1/_search",
      body: {
        MdmsCriteria: {
          tenantId: tenantId,
          moduleDetails: [
            {
              moduleName: "common-masters",
              masterDetails: [
                {
                  name: "StateInfo"
                }
              ]
            }
          ]
        }
      },
      method: "POST"
    });
    
    return response?.MdmsRes?.["common-masters"]?.StateInfo || [];
  } catch (error) {
    // Return default states if MDMS fails
    return [
      { code: "andhra_pradesh", name: "Andhra Pradesh" },
      { code: "bihar", name: "Bihar" },
      { code: "chhattisgarh", name: "Chhattisgarh" },
      { code: "delhi", name: "Delhi" },
      { code: "goa", name: "Goa" },
      { code: "gujarat", name: "Gujarat" },
      { code: "haryana", name: "Haryana" },
      { code: "himachal_pradesh", name: "Himachal Pradesh" },
      { code: "jharkhand", name: "Jharkhand" },
      { code: "karnataka", name: "Karnataka" },
      { code: "kerala", name: "Kerala" },
      { code: "madhya_pradesh", name: "Madhya Pradesh" },
      { code: "maharashtra", name: "Maharashtra" },
      { code: "odisha", name: "Odisha" },
      { code: "punjab", name: "Punjab" },
      { code: "rajasthan", name: "Rajasthan" },
      { code: "tamil_nadu", name: "Tamil Nadu" },
      { code: "telangana", name: "Telangana" },
      { code: "uttar_pradesh", name: "Uttar Pradesh" },
      { code: "uttarakhand", name: "Uttarakhand" },
      { code: "west_bengal", name: "West Bengal" }
    ];
  }
};

/**
 * Hook to get advocate types using DIGIT MDMS hook
 * @param {string} tenantId - Tenant ID
 * @returns {Object} { data, isLoading, error }
 */
export const useAdvocateTypes = (tenantId) => {
  return Digit.Hooks.useCustomMDMS(
    tenantId,
    "AdvocateRegistry",
    [
      {
        name: "AdvocateType"
      }
    ],
    {
      select: (data) => {
        return data?.AdvocateRegistry?.AdvocateType || [];
      }
    }
  );
};

/**
 * Hook to get states using DIGIT MDMS hook
 * @param {string} tenantId - Tenant ID
 * @returns {Object} { data, isLoading, error }
 */
export const useStates = (tenantId) => {
  return Digit.Hooks.useCustomMDMS(
    tenantId,
    "common-masters",
    [
      {
        name: "StateInfo"
      }
    ],
    {
      select: (data) => {
        return data?.["common-masters"]?.StateInfo || [];
      }
    }
  );
};
