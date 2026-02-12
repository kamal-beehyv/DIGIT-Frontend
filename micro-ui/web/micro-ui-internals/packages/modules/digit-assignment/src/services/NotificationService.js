/**
 * Notification Service
 * Handles SMS notifications (mocked for frontend assignment)
 * In production, this would integrate with actual SMS gateway
 */

/**
 * Send SMS notification (mocked)
 * @param {Object} params - { mobileNumber, message, type }
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object>} Mock response
 */
export const sendSMS = async (params, tenantId) => {
  const { mobileNumber, message, type } = params;
  
  // Mock SMS sending - in production this would call actual SMS gateway
  if (process.env.NODE_ENV === 'development') {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📱 [NotificationService] Mock SMS Notification');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📞 To: ${mobileNumber}`);
    console.log(`📝 Type: ${type || 'GENERAL'}`);
    console.log(`💬 Message: ${message}`);
    console.log('═══════════════════════════════════════════════════════\n');
  }
  
  // Return mock success response
  return {
    success: true,
    messageId: `mock-sms-${Date.now()}`,
    timestamp: new Date().toISOString()
  };
};

/**
 * Send registration approval SMS
 * @param {Object} params - { mobileNumber, applicationNumber, userName }
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object>} Mock response
 */
export const sendApprovalSMS = async (params, tenantId) => {
  const { mobileNumber, applicationNumber, userName } = params;
  const message = `Dear ${userName || 'User'}, your registration application ${applicationNumber} has been approved. You can now log in to access the portal.`;
  
  return sendSMS({
    mobileNumber,
    message,
    type: 'REGISTRATION_APPROVED'
  }, tenantId);
};

/**
 * Send registration rejection SMS
 * @param {Object} params - { mobileNumber, applicationNumber, userName, rejectionReason }
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object>} Mock response
 */
export const sendRejectionSMS = async (params, tenantId) => {
  const { mobileNumber, applicationNumber, userName, rejectionReason } = params;
  const message = `Dear ${userName || 'User'}, your registration application ${applicationNumber} has been rejected. Reason: ${rejectionReason || 'Please contact support for details'}.`;
  
  return sendSMS({
    mobileNumber,
    message,
    type: 'REGISTRATION_REJECTED'
  }, tenantId);
};

/**
 * Send auto-approval SMS for litigants
 * @param {Object} params - { mobileNumber, applicationNumber, userName }
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object>} Mock response
 */
export const sendAutoApprovalSMS = async (params, tenantId) => {
  const { mobileNumber, applicationNumber, userName } = params;
  const message = `Dear ${userName || 'User'}, your registration application ${applicationNumber} has been automatically approved. You can now log in to access the portal.`;
  
  return sendSMS({
    mobileNumber,
    message,
    type: 'REGISTRATION_AUTO_APPROVED'
  }, tenantId);
};
