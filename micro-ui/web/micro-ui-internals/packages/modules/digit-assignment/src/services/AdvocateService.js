/**
 * Advocate Service
 * Handles all advocate-related API calls
 */

/**
 * Create a new advocate registration
 * @param {Object} advocateData - Advocate data object
 * @param {string} tenantId - Tenant ID
 * @returns {Promise} API response
 */
export const createAdvocate = async (advocateData, tenantId) => {
  try {
    const response = await Digit.CustomService.getResponse({
      url: "/advocate/v1/_create",
      body: {
        advocates: [advocateData]
      },
      method: "POST"
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing advocate registration
 * @param {Object} advocateData - Updated advocate data object (must include id)
 * @param {string} tenantId - Tenant ID
 * @returns {Promise} API response
 */
export const updateAdvocate = async (advocateData, tenantId) => {
  try {
    const response = await Digit.CustomService.getResponse({
      url: "/advocate/v1/_update",
      body: {
        advocates: [advocateData]
      },
      method: "POST"
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Search for advocates
 * @param {Object} searchCriteria - Search criteria object
 * @param {string} tenantId - Tenant ID
 * @returns {Promise} API response
 */
export const searchAdvocates = async (searchCriteria, tenantId) => {
  try {
    const response = await Digit.CustomService.getResponse({
      url: "/advocate/v1/_search",
      body: {
        criteria: [searchCriteria]
      },
      method: "POST"
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get advocate by application number
 * @param {string} applicationNumber - Application number
 * @param {string} tenantId - Tenant ID
 * @returns {Promise} Advocate object
 */
export const getAdvocateByApplicationNumber = async (applicationNumber, tenantId) => {
  try {
    const response = await searchAdvocates({ applicationNumber }, tenantId);
    if (response?.advocates && response.advocates.length > 0) {
      return response.advocates[0];
    }
    return null;
  } catch (error) {
    throw error;
  }
};

/**
 * Get advocate by ID
 * @param {string} id - Advocate ID
 * @param {string} tenantId - Tenant ID
 * @returns {Promise} Advocate object
 */
export const getAdvocateById = async (id, tenantId) => {
  try {
    const response = await searchAdvocates({ id }, tenantId);
    if (response?.advocates && response.advocates.length > 0) {
      return response.advocates[0];
    }
    return null;
  } catch (error) {
    throw error;
  }
};
