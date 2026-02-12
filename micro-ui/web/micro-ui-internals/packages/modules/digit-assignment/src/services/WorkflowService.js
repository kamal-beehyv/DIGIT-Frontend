/**
 * Workflow Service
 * Handles workflow-related API calls for advocate registration
 */

/**
 * Start workflow for a new advocate registration
 * @param {Object} workflowData - Workflow data object
 * @param {string} tenantId - Tenant ID
 * @returns {Promise} API response
 */
export const startWorkflow = async (workflowData, tenantId) => {
  try {
    const response = await Digit.CustomService.getResponse({
      url: "/egov-workflow-v2/egov-wf/process/_transition",
      body: {
        ProcessInstances: [workflowData]
      },
      method: "POST"
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Update workflow state (approve/reject)
 * @param {Object} workflowData - Workflow update data
 * @param {string} tenantId - Tenant ID
 * @returns {Promise} API response
 */
export const updateWorkflow = async (workflowData, tenantId) => {
  try {
    const response = await Digit.CustomService.getResponse({
      url: "/egov-workflow-v2/egov-wf/process/_transition",
      body: {
        ProcessInstances: [workflowData]
      },
      method: "POST"
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Search workflow instances
 * @param {Object} searchCriteria - Search criteria
 * @param {string} tenantId - Tenant ID
 * @returns {Promise} API response
 */
export const searchWorkflow = async (searchCriteria, tenantId) => {
  try {
    const response = await Digit.CustomService.getResponse({
      url: "/egov-workflow-v2/egov-wf/process/_search",
      body: {
        criteria: searchCriteria
      },
      method: "POST"
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get workflow details by business ID
 * Uses DIGIT's built-in workflow hook
 * @param {Object} params - { tenantId, id, moduleCode }
 * @returns {Object} Workflow details hook result
 */
export const useWorkflowDetails = (params) => {
  return Digit.Hooks.useWorkflowDetailsV2({
    tenantId: params.tenantId,
    id: params.id,
    moduleCode: params.moduleCode || "AdvocateRegistration",
    config: {
      enabled: !!params.id,
      cacheTime: 0
    }
  });
};

/**
 * Create workflow data for new registration
 * @param {Object} params - { businessId, tenantId, action, comment, assignee }
 * @returns {Object} Workflow process instance data
 */
export const createWorkflowData = (params) => {
  const { businessId, tenantId, action = "Register", comment = "", assignee = null } = params;
  
  return {
    businessId: businessId,
    businessService: "AdvocateRegistration",
    moduleName: "AdvocateRegistration",
    action: action,
    state: {
      action: action,
      state: "User Registration Requested"
    },
    comment: comment,
    assignee: assignee,
    tenantId: tenantId
  };
};

/**
 * Create workflow update data for approve/reject
 * @param {Object} params - { businessId, tenantId, action, comment, assignee }
 * @returns {Object} Workflow process instance data
 */
export const createWorkflowUpdateData = (params) => {
  const { businessId, tenantId, action, comment = "", assignee = null } = params;
  
  let nextState = "User Registered";
  if (action === "Reject") {
    nextState = "User Rejected";
  }
  
  return {
    businessId: businessId,
    businessService: "AdvocateRegistration",
    moduleName: "AdvocateRegistration",
    action: action,
    state: {
      action: action,
      state: nextState
    },
    comment: comment,
    assignee: assignee,
    tenantId: tenantId
  };
};

/**
 * Auto-approve workflow for litigants (mocked)
 * This simulates the auto-approval that happens for litigants after Aadhaar verification
 * @param {Object} params - { businessId, tenantId, comment }
 * @returns {Promise<Object>} Mock workflow response
 */
export const autoApproveWorkflow = async (params) => {
  const { businessId, tenantId, comment = "Auto-approved: Litigant verified via Aadhaar" } = params;
  
  // Mock auto-approval - in production this would be handled by backend
  if (process.env.NODE_ENV === 'development') {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ [WorkflowService] Auto-approving Litigant Registration');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📋 Application: ${businessId}`);
    console.log(`🏢 Tenant: ${tenantId}`);
    console.log(`💬 Comment: ${comment}`);
    console.log(`📊 New State: User Registered`);
    console.log('═══════════════════════════════════════════════════════\n');
  }
  
  // Try to call actual workflow API first, but mock response if it fails
  try {
    const workflowData = createWorkflowUpdateData({
      businessId,
      tenantId,
      action: "Approve",
      comment
    });
    
    const response = await updateWorkflow(workflowData, tenantId);
    return response;
  } catch (error) {
    // Return mock response if API call fails (for frontend assignment)
    return {
      ProcessInstances: [{
        businessId: businessId,
        businessService: "AdvocateRegistration",
        state: {
          state: "User Registered",
          applicationStatus: "APPROVED"
        },
        comment: comment,
        tenantId: tenantId
      }]
    };
  }
};
