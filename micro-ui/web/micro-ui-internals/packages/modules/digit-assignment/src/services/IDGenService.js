/**
 * ID Generation Service
 * Handles application number generation using IDGen service
 */

/**
 * Generate application number for advocate
 * Format: ADVOC_<SEQUENCE>_<YEAR>
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<string>} Application number
 */
export const generateAdvocateApplicationNumber = async (tenantId) => {
  try {
    const response = await Digit.CustomService.getResponse({
      url: "/egov-idgen/id/_generate",
      body: {
        idRequests: [
          {
            tenantId: tenantId,
            idName: "advocate.application.number"
          }
        ]
      },
      method: "POST"
    });
    
    if (response?.idResponses && response.idResponses.length > 0) {
      return response.idResponses[0].id;
    }
    
    // Fallback: Generate manually if IDGen fails
    return generateFallbackAdvocateId(tenantId);
  } catch (error) {
    // Fallback: Generate manually if IDGen fails
    return generateFallbackAdvocateId(tenantId);
  }
};

/**
 * Generate application number for advocate clerk
 * Format: ADVOC_CLERK_<SEQUENCE>_<YEAR>
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<string>} Application number
 */
export const generateClerkApplicationNumber = async (tenantId) => {
  try {
    const response = await Digit.CustomService.getResponse({
      url: "/egov-idgen/id/_generate",
      body: {
        idRequests: [
          {
            tenantId: tenantId,
            idName: "advocate.clerk.application.number"
          }
        ]
      },
      method: "POST"
    });
    
    if (response?.idResponses && response.idResponses.length > 0) {
      return response.idResponses[0].id;
    }
    
    // Fallback: Generate manually if IDGen fails
    return generateFallbackClerkId(tenantId);
  } catch (error) {
    // Fallback: Generate manually if IDGen fails
    return generateFallbackClerkId(tenantId);
  }
};

/**
 * Fallback: Generate advocate application number manually
 * Format: ADVOC_<SEQUENCE>_<YEAR>
 * @param {string} tenantId - Tenant ID
 * @returns {string} Application number
 */
const generateFallbackAdvocateId = (tenantId) => {
  const year = new Date().getFullYear();
  // Use sessionStorage to maintain sequence across page refreshes
  const storageKey = `advocate_seq_${year}`;
  let sequence = parseInt(sessionStorage.getItem(storageKey) || "0", 10);
  sequence += 1;
  sessionStorage.setItem(storageKey, sequence.toString());
  const seqStr = String(sequence).padStart(3, "0");
  return `ADVOC_${seqStr}_${year}`;
};

/**
 * Fallback: Generate clerk application number manually
 * Format: ADVOC_CLERK_<SEQUENCE>_<YEAR>
 * @param {string} tenantId - Tenant ID
 * @returns {string} Application number
 */
const generateFallbackClerkId = (tenantId) => {
  const year = new Date().getFullYear();
  // Use sessionStorage to maintain sequence across page refreshes
  const storageKey = `advocate_clerk_seq_${year}`;
  let sequence = parseInt(sessionStorage.getItem(storageKey) || "0", 10);
  sequence += 1;
  sessionStorage.setItem(storageKey, sequence.toString());
  const seqStr = String(sequence).padStart(3, "0");
  return `ADVOC_CLERK_${seqStr}_${year}`;
};
