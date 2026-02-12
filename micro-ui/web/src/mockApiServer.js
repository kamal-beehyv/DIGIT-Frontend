/**
 * Mock API Server for Advocate Registration
 * Based on OPENAPI_ADVOCATE_REGISTRATION.md specification
 */

// In-memory storage for mock advocates
let mockAdvocates = [];
let nextId = 1;

// In-memory storage for mock individuals
let mockIndividuals = [];
let individualNextId = 1;

// In-memory storage for mock users
let mockUsers = [];
let userNextId = 1;
let userNumericId = 1000; // Numeric ID counter for user.id (Long type)

// In-memory storage for OTPs (mobileNumber -> OTP)
let mockOTPs = {};

// Helper function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to generate application number
// PRD: ADVOC_<SEQUENCE_NUMBER>_<YEAR>, sequence begins with 001 (3 digits)
function generateApplicationNumber(tenantId) {
  const year = new Date().getFullYear();
  const seq = String(nextId).padStart(3, '0');
  return `ADVOC_${seq}_${year}`;
}

// Helper function to create response info
function createResponseInfo(requestInfo, status = 'successful') {
  return {
    apiId: requestInfo?.apiId || 'Rainmaker',
    ver: requestInfo?.ver || '1.0',
    ts: new Date().toISOString(),
    resMsgId: generateUUID(),
    msgId: requestInfo?.msgId || '20170310130900|en_IN',
    status: status
  };
}

// Helper function to create audit details
function createAuditDetails() {
  const now = Date.now();
  return {
    createdBy: 'system',
    createdTime: now,
    lastModifiedBy: 'system',
    lastModifiedTime: now
  };
}

// Mock API handlers
const mockApiHandlers = {
  // POST /advocate/v1/_create
  createAdvocate: (req, res) => {
    try {
      const { requestInfo, advocates } = req.body;

      if (!advocates || !Array.isArray(advocates) || advocates.length === 0) {
        return res.status(400).json({
          ResponseInfo: createResponseInfo(requestInfo, 'failed'),
          Errors: [{
            code: 'ADVOCATE_REGISTRATION_FAILED',
            message: 'Advocates array is required and cannot be empty',
            description: 'At least one advocate object must be provided in the advocates array'
          }]
        });
      }

      const createdAdvocates = advocates.map(advocate => {
        // Validate required fields
        if (!advocate.tenantId || !advocate.userId || !advocate.advocateType) {
          throw new Error('tenantId, userId, and advocateType are required fields');
        }

        // Check if bar registration number already exists
        if (advocate.barRegistrationNumber) {
          const existing = mockAdvocates.find(
            a => a.barRegistrationNumber === advocate.barRegistrationNumber && 
                 a.tenantId === advocate.tenantId
          );
          if (existing) {
            throw new Error(`Bar registration number ${advocate.barRegistrationNumber} already exists`);
          }
        }

        const id = generateUUID();
        const applicationNumber = generateApplicationNumber(advocate.tenantId);
        nextId++;

        const newAdvocate = {
          id,
          tenantId: advocate.tenantId,
          userId: advocate.userId,
          applicationNumber,
          barRegistrationNumber: advocate.barRegistrationNumber || `BAR${String(nextId).padStart(6, '0')}`,
          advocateType: advocate.advocateType,
          organisationID: advocate.organisationID || null,
          individualId: advocate.individualId || null,
          isActive: advocate.isActive !== undefined ? advocate.isActive : true,
          workflow: advocate.workflow || {
            action: 'Register',
            state: {
              uuid: generateUUID(),
              state: 'User Registration Requested'
            }
          },
          documents: advocate.documents || [],
          auditDetails: createAuditDetails(),
          additionalDetails: advocate.additionalDetails || {}
        };

        mockAdvocates.push(newAdvocate);
        return newAdvocate;
      });

      res.status(201).json({
        responseInfo: createResponseInfo(requestInfo),
        advocates: createdAdvocates
      });
    } catch (error) {
      res.status(400).json({
        ResponseInfo: createResponseInfo(req.body?.requestInfo, 'failed'),
        Errors: [{
          code: 'ADVOCATE_REGISTRATION_FAILED',
          message: error.message,
          description: error.message
        }]
      });
    }
  },

  // POST /advocate/v1/_update
  updateAdvocate: (req, res) => {
    try {
      const { requestInfo, advocates } = req.body;

      if (!advocates || !Array.isArray(advocates) || advocates.length === 0) {
        return res.status(400).json({
          ResponseInfo: createResponseInfo(requestInfo, 'failed'),
          Errors: [{
            code: 'ADVOCATE_UPDATE_FAILED',
            message: 'Advocates array is required and cannot be empty',
            description: 'At least one advocate object must be provided in the advocates array'
          }]
        });
      }

      const updatedAdvocates = advocates.map(advocate => {
        if (!advocate.id) {
          throw new Error('id is required for update operation');
        }

        const existingIndex = mockAdvocates.findIndex(a => a.id === advocate.id);
        if (existingIndex === -1) {
          throw new Error(`Advocate with id ${advocate.id} not found`);
        }

        // Check if bar registration number conflicts with another advocate
        if (advocate.barRegistrationNumber) {
          const conflicting = mockAdvocates.find(
            a => a.id !== advocate.id &&
                 a.barRegistrationNumber === advocate.barRegistrationNumber &&
                 a.tenantId === advocate.tenantId
          );
          if (conflicting) {
            throw new Error(`Bar registration number ${advocate.barRegistrationNumber} already exists for another advocate`);
          }
        }

        const existing = mockAdvocates[existingIndex];
        const updatedAdvocate = {
          ...existing,
          ...advocate,
          id: existing.id, // Prevent ID changes
          applicationNumber: existing.applicationNumber, // Prevent application number changes
          auditDetails: {
            ...existing.auditDetails,
            lastModifiedBy: 'system',
            lastModifiedTime: Date.now()
          }
        };

        mockAdvocates[existingIndex] = updatedAdvocate;
        return updatedAdvocate;
      });

      res.status(201).json({
        responseInfo: createResponseInfo(requestInfo),
        advocates: updatedAdvocates
      });
    } catch (error) {
      res.status(400).json({
        ResponseInfo: createResponseInfo(req.body?.requestInfo, 'failed'),
        Errors: [{
          code: 'ADVOCATE_UPDATE_FAILED',
          message: error.message,
          description: error.message
        }]
      });
    }
  },

  // POST /advocate/v1/_search
  searchAdvocates: (req, res) => {
    try {
      const { requestInfo, criteria } = req.body;

      if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
        // Return all advocates if no criteria provided
        return res.status(201).json({
          responseInfo: createResponseInfo(requestInfo),
          advocates: mockAdvocates.filter(a => a.isActive !== false),
          pagination: {
            totalCount: mockAdvocates.filter(a => a.isActive !== false).length,
            offset: 0,
            limit: 10
          }
        });
      }

      let results = [...mockAdvocates];

      // Apply search criteria
      criteria.forEach(criterion => {
        if (criterion.id) {
          results = results.filter(a => a.id === criterion.id);
        }
        if (criterion.barRegistrationNumber) {
          results = results.filter(a => a.barRegistrationNumber === criterion.barRegistrationNumber);
        }
        if (criterion.applicationNumber) {
          results = results.filter(a => a.applicationNumber === criterion.applicationNumber);
        }
        if (criterion.tenantId) {
          results = results.filter(a => a.tenantId === criterion.tenantId);
        }
        if (criterion.advocateType) {
          results = results.filter(a => a.advocateType === criterion.advocateType);
        }
        if (criterion.individualId) {
          results = results.filter(a => a.individualId === criterion.individualId);
        }
        if (criterion.userId) {
          results = results.filter(a => a.userId === criterion.userId);
        }
        if (criterion.isActive !== undefined) {
          results = results.filter(a => a.isActive === criterion.isActive);
        }
      });

      // Filter out inactive advocates by default (unless explicitly requested)
      const hasActiveFilter = criteria.some(c => c.isActive !== undefined);
      if (!hasActiveFilter) {
        results = results.filter(a => a.isActive !== false);
      }

      res.status(201).json({
        responseInfo: createResponseInfo(requestInfo),
        advocates: results,
        pagination: {
          totalCount: results.length,
          offset: 0,
          limit: 10
        }
      });
    } catch (error) {
      res.status(400).json({
        ResponseInfo: createResponseInfo(req.body?.requestInfo, 'failed'),
        Errors: [{
          code: 'ADVOCATE_SEARCH_FAILED',
          message: error.message,
          description: error.message
        }]
      });
    }
  }
};

// MDMS Mock Data for Advocate Types
const mockMDMSData = {
  'AdvocateType': [
    {
      code: 'PROSECUTOR',
      name: 'Prosecutor',
      active: true
    },
    {
      code: 'PUBLIC_DEFENDER',
      name: 'Public Defender',
      active: true
    },
    {
      code: 'PRIVATE_PRACTICE',
      name: 'Private Practice',
      active: true
    },
    {
      code: 'GOVERNMENT_LAWYER',
      name: 'Government Lawyer',
      active: true
    }
  ],
  'StateInfo': [
    {
      code: 'dev',
      name: 'Development State',
      logoUrl: null,
      logoUrlWhite: null,
      hasLocalisation: true,
      languages: ['en_IN', 'hi_IN'],
      defaultLanguage: 'en_IN'
    }
  ],
  'uiHomePage': [
    {
      code: 'dev',
      appBannerDesktop: null,
      appBannerMobile: null,
      citizenServicesCard: [],
      informationAndUpdatesCard: [],
      whatsAppBannerDesktop: null,
      whatsAppBannerMobile: null,
      whatsNewSection: null
    }
  ],
  'Department': [
    {
      code: 'ADMIN',
      name: 'Administration',
      active: true
    },
    {
      code: 'REVENUE',
      name: 'Revenue',
      active: true
    },
    {
      code: 'ENG',
      name: 'Engineering',
      active: true
    },
    {
      code: 'HEALTH',
      name: 'Health',
      active: true
    }
  ],
  'Designation': [
    {
      code: 'ADMIN_OFFICER',
      name: 'Administrative Officer',
      active: true
    },
    {
      code: 'REVENUE_OFFICER',
      name: 'Revenue Officer',
      active: true
    },
    {
      code: 'ENGINEER',
      name: 'Engineer',
      active: true
    },
    {
      code: 'CLERK',
      name: 'Clerk',
      active: true
    }
  ],
  'wfSlaConfig': [
    {
      businessService: 'ADVOCATE_REGISTRATION',
      sla: 7,
      unit: 'DAYS',
      active: true
    }
  ],
  'tenants': [
    {
      code: 'ka.bangalore',
      name: 'Bangalore',
      i18nKey: 'TENANT_TENANTS_KA_BANGALORE',
      description: 'Bangalore City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://bangalore.digit.org',
      type: 'CITY',
      state: 'Karnataka',
      district: 'Bangalore Urban',
      city: {
        name: 'Bangalore',
        code: 'ka.bangalore',
        districtCode: 'bangalore_urban',
        districtName: 'Bangalore Urban',
        regionName: 'Bangalore Region',
        ulbGrade: 'A'
      },
      active: true
    },
    {
      code: 'ka.mysore',
      name: 'Mysore',
      i18nKey: 'TENANT_TENANTS_KA_MYSORE',
      description: 'Mysore City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://mysore.digit.org',
      type: 'CITY',
      state: 'Karnataka',
      district: 'Mysore',
      city: {
        name: 'Mysore',
        code: 'ka.mysore',
        districtCode: 'mysore',
        districtName: 'Mysore',
        regionName: 'Mysore Region',
        ulbGrade: 'A'
      },
      active: true
    },
    {
      code: 'ka.mangalore',
      name: 'Mangalore',
      i18nKey: 'TENANT_TENANTS_KA_MANGALORE',
      description: 'Mangalore City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://mangalore.digit.org',
      type: 'CITY',
      state: 'Karnataka',
      district: 'Dakshina Kannada',
      city: {
        name: 'Mangalore',
        code: 'ka.mangalore',
        districtCode: 'dakshina_kannada',
        districtName: 'Dakshina Kannada',
        regionName: 'Coastal Karnataka',
        ulbGrade: 'A'
      },
      active: true
    },
    {
      code: 'mh.mumbai',
      name: 'Mumbai',
      i18nKey: 'TENANT_TENANTS_MH_MUMBAI',
      description: 'Mumbai City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://mumbai.digit.org',
      type: 'CITY',
      state: 'Maharashtra',
      district: 'Mumbai',
      city: {
        name: 'Mumbai',
        code: 'mh.mumbai',
        districtCode: 'mumbai',
        districtName: 'Mumbai',
        regionName: 'Mumbai Region',
        ulbGrade: 'A+'
      },
      active: true
    },
    {
      code: 'mh.pune',
      name: 'Pune',
      i18nKey: 'TENANT_TENANTS_MH_PUNE',
      description: 'Pune City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://pune.digit.org',
      type: 'CITY',
      state: 'Maharashtra',
      district: 'Pune',
      city: {
        name: 'Pune',
        code: 'mh.pune',
        districtCode: 'pune',
        districtName: 'Pune',
        regionName: 'Pune Region',
        ulbGrade: 'A'
      },
      active: true
    },
    {
      code: 'tn.chennai',
      name: 'Chennai',
      i18nKey: 'TENANT_TENANTS_TN_CHENNAI',
      description: 'Chennai City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://chennai.digit.org',
      type: 'CITY',
      state: 'Tamil Nadu',
      district: 'Chennai',
      city: {
        name: 'Chennai',
        code: 'tn.chennai',
        districtCode: 'chennai',
        districtName: 'Chennai',
        regionName: 'Chennai Region',
        ulbGrade: 'A+'
      },
      active: true
    },
    {
      code: 'tn.coimbatore',
      name: 'Coimbatore',
      i18nKey: 'TENANT_TENANTS_TN_COIMBATORE',
      description: 'Coimbatore City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://coimbatore.digit.org',
      type: 'CITY',
      state: 'Tamil Nadu',
      district: 'Coimbatore',
      city: {
        name: 'Coimbatore',
        code: 'tn.coimbatore',
        districtCode: 'coimbatore',
        districtName: 'Coimbatore',
        regionName: 'Coimbatore Region',
        ulbGrade: 'A'
      },
      active: true
    },
    {
      code: 'dl.delhi',
      name: 'Delhi',
      i18nKey: 'TENANT_TENANTS_DL_DELHI',
      description: 'Delhi City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://delhi.digit.org',
      type: 'CITY',
      state: 'Delhi',
      district: 'New Delhi',
      city: {
        name: 'Delhi',
        code: 'dl.delhi',
        districtCode: 'new_delhi',
        districtName: 'New Delhi',
        regionName: 'Delhi Region',
        ulbGrade: 'A+'
      },
      active: true
    },
    {
      code: 'dev',
      name: 'Development',
      i18nKey: 'TENANT_TENANTS_DEV',
      description: 'Development Tenant',
      logoId: null,
      imageId: null,
      domainUrl: 'https://dev.digit.org',
      type: 'CITY',
      state: 'Karnataka',
      district: 'Bangalore Urban',
      city: {
        name: 'Development City',
        code: 'dev',
        districtCode: 'dev',
        districtName: 'Development District',
        regionName: 'Development Region',
        ulbGrade: 'A'
      },
      active: true
    },
    {
      code: 'dev.city1',
      name: 'City 1',
      i18nKey: 'TENANT_TENANTS_DEV_CITY1',
      description: 'City 1 Tenant',
      logoId: null,
      imageId: null,
      domainUrl: 'https://city1.digit.org',
      type: 'CITY',
      state: 'Karnataka',
      district: 'Bangalore Urban',
      city: {
        name: 'City 1',
        code: 'dev.city1',
        districtCode: 'dev',
        districtName: 'Development District',
        regionName: 'Development Region',
        ulbGrade: 'A'
      },
      active: true
    },
    {
      code: 'dev.city2',
      name: 'City 2',
      i18nKey: 'TENANT_TENANTS_DEV_CITY2',
      description: 'City 2 Tenant',
      logoId: null,
      imageId: null,
      domainUrl: 'https://city2.digit.org',
      type: 'CITY',
      state: 'Maharashtra',
      district: 'Mumbai',
      city: {
        name: 'City 2',
        code: 'dev.city2',
        districtCode: 'dev',
        districtName: 'Development District',
        regionName: 'Development Region',
        ulbGrade: 'B'
      },
      active: true
    }
  ],
  'citymodule': [
    {
      code: 'PGR',
      name: 'Public Grievance Redressal',
      order: 1,
      active: true,
      tenants: [
        { code: 'dev', active: true },
        { code: 'dev.city1', active: true },
        { code: 'dev.city2', active: true }
      ]
    },
    {
      code: 'DSS',
      name: 'Dashboard',
      order: 2,
      active: true,
      tenants: [
        { code: 'dev', active: true },
        { code: 'dev.city1', active: true }
      ]
    },
    {
      code: 'HRMS',
      name: 'Human Resource Management',
      order: 3,
      active: true,
      tenants: [
        { code: 'dev', active: true }
      ]
    },
    {
      code: 'Utilities',
      name: 'Utilities',
      order: 4,
      active: true,
      tenants: [
        { code: 'dev', active: true },
        { code: 'dev.city1', active: true }
      ]
    },
    {
      code: 'Engagement',
      name: 'Engagement',
      order: 5,
      active: true,
      tenants: [
        { code: 'dev', active: true }
      ]
    },
    {
      code: 'Workbench',
      name: 'Workbench',
      order: 6,
      active: true,
      tenants: [
        { code: 'dev', active: true }
      ]
    }
  ],
  'cities': [
    {
      code: 'ka.bangalore',
      name: 'Bangalore',
      i18nKey: 'TENANT_TENANTS_KA_BANGALORE',
      description: 'Bangalore City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://bangalore.digit.org',
      type: 'CITY',
      state: 'Karnataka',
      district: 'Bangalore Urban',
      city: {
        name: 'Bangalore',
        code: 'ka.bangalore',
        districtCode: 'bangalore_urban',
        districtName: 'Bangalore Urban',
        regionName: 'Bangalore Region',
        ulbGrade: 'A'
      },
      active: true
    },
    {
      code: 'ka.mysore',
      name: 'Mysore',
      i18nKey: 'TENANT_TENANTS_KA_MYSORE',
      description: 'Mysore City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://mysore.digit.org',
      type: 'CITY',
      state: 'Karnataka',
      district: 'Mysore',
      city: {
        name: 'Mysore',
        code: 'ka.mysore',
        districtCode: 'mysore',
        districtName: 'Mysore',
        regionName: 'Mysore Region',
        ulbGrade: 'A'
      },
      active: true
    },
    {
      code: 'ka.mangalore',
      name: 'Mangalore',
      i18nKey: 'TENANT_TENANTS_KA_MANGALORE',
      description: 'Mangalore City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://mangalore.digit.org',
      type: 'CITY',
      state: 'Karnataka',
      district: 'Dakshina Kannada',
      city: {
        name: 'Mangalore',
        code: 'ka.mangalore',
        districtCode: 'dakshina_kannada',
        districtName: 'Dakshina Kannada',
        regionName: 'Coastal Karnataka',
        ulbGrade: 'A'
      },
      active: true
    },
    {
      code: 'mh.mumbai',
      name: 'Mumbai',
      i18nKey: 'TENANT_TENANTS_MH_MUMBAI',
      description: 'Mumbai City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://mumbai.digit.org',
      type: 'CITY',
      state: 'Maharashtra',
      district: 'Mumbai',
      city: {
        name: 'Mumbai',
        code: 'mh.mumbai',
        districtCode: 'mumbai',
        districtName: 'Mumbai',
        regionName: 'Mumbai Region',
        ulbGrade: 'A+'
      },
      active: true
    },
    {
      code: 'mh.pune',
      name: 'Pune',
      i18nKey: 'TENANT_TENANTS_MH_PUNE',
      description: 'Pune City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://pune.digit.org',
      type: 'CITY',
      state: 'Maharashtra',
      district: 'Pune',
      city: {
        name: 'Pune',
        code: 'mh.pune',
        districtCode: 'pune',
        districtName: 'Pune',
        regionName: 'Pune Region',
        ulbGrade: 'A'
      },
      active: true
    },
    {
      code: 'tn.chennai',
      name: 'Chennai',
      i18nKey: 'TENANT_TENANTS_TN_CHENNAI',
      description: 'Chennai City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://chennai.digit.org',
      type: 'CITY',
      state: 'Tamil Nadu',
      district: 'Chennai',
      city: {
        name: 'Chennai',
        code: 'tn.chennai',
        districtCode: 'chennai',
        districtName: 'Chennai',
        regionName: 'Chennai Region',
        ulbGrade: 'A+'
      },
      active: true
    },
    {
      code: 'tn.coimbatore',
      name: 'Coimbatore',
      i18nKey: 'TENANT_TENANTS_TN_COIMBATORE',
      description: 'Coimbatore City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://coimbatore.digit.org',
      type: 'CITY',
      state: 'Tamil Nadu',
      district: 'Coimbatore',
      city: {
        name: 'Coimbatore',
        code: 'tn.coimbatore',
        districtCode: 'coimbatore',
        districtName: 'Coimbatore',
        regionName: 'Coimbatore Region',
        ulbGrade: 'A'
      },
      active: true
    },
    {
      code: 'dl.delhi',
      name: 'Delhi',
      i18nKey: 'TENANT_TENANTS_DL_DELHI',
      description: 'Delhi City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://delhi.digit.org',
      type: 'CITY',
      state: 'Delhi',
      district: 'New Delhi',
      city: {
        name: 'Delhi',
        code: 'dl.delhi',
        districtCode: 'new_delhi',
        districtName: 'New Delhi',
        regionName: 'Delhi Region',
        ulbGrade: 'A+'
      },
      active: true
    },
    {
      code: 'dev',
      name: 'Development',
      i18nKey: 'TENANT_TENANTS_DEV',
      description: 'Development City',
      logoId: null,
      imageId: null,
      domainUrl: 'https://dev.digit.org',
      type: 'CITY',
      state: 'Karnataka',
      district: 'Bangalore Urban',
      city: {
        name: 'Development City',
        code: 'dev',
        districtCode: 'dev',
        districtName: 'Development District',
        regionName: 'Development Region',
        ulbGrade: 'A'
      },
      active: true
    },
    {
      code: 'dev.city1',
      name: 'City 1',
      i18nKey: 'TENANT_TENANTS_DEV_CITY1',
      description: 'City 1',
      logoId: null,
      imageId: null,
      domainUrl: 'https://city1.digit.org',
      type: 'CITY',
      state: 'Karnataka',
      district: 'Bangalore Urban',
      city: {
        name: 'City 1',
        code: 'dev.city1',
        districtCode: 'dev',
        districtName: 'Development District',
        regionName: 'Development Region',
        ulbGrade: 'A'
      },
      active: true
    },
    {
      code: 'dev.city2',
      name: 'City 2',
      i18nKey: 'TENANT_TENANTS_DEV_CITY2',
      description: 'City 2',
      logoId: null,
      imageId: null,
      domainUrl: 'https://city2.digit.org',
      type: 'CITY',
      state: 'Maharashtra',
      district: 'Mumbai',
      city: {
        name: 'City 2',
        code: 'dev.city2',
        districtCode: 'dev',
        districtName: 'Development District',
        regionName: 'Development Region',
        ulbGrade: 'B'
      },
      active: true
    }
  ],
  'ApiCachingSettings': [
    {
      apiName: 'egov-mdms-service',
      cacheEnabled: false,
      ttl: 3600
    },
    {
      apiName: 'tenant-management',
      cacheEnabled: true,
      ttl: 86400
    }
  ]
};

// MDMS Search Handler
mockApiHandlers.searchMDMS = (req, res) => {
  try {
    console.log('[MOCK API MDMS] searchMDMS called');
    console.log('[MOCK API MDMS] Request query:', req.query);
    console.log('[MOCK API MDMS] Request body:', JSON.stringify(req.body, null, 2));
    
    // Support both POST (body) and GET (query) requests
    const MdmsCriteria = req.body?.MdmsCriteria || (req.query.moduleName ? {
      moduleDetails: [{
        moduleName: req.query.moduleName,
        masterDetails: req.query.masterName ? [{ name: req.query.masterName }] : []
      }]
    } : null);
    
    const tenantId = req.query.tenantId || req.body?.MdmsCriteria?.tenantId || 'dev';
    console.log('[MOCK API MDMS] TenantId:', tenantId);
    console.log('[MOCK API MDMS] MdmsCriteria:', JSON.stringify(MdmsCriteria, null, 2));

    if (!MdmsCriteria || !MdmsCriteria.moduleDetails) {
      // Return default data if no criteria provided
      const result = {
        'AdvocateRegistry': {
          'AdvocateType': mockMDMSData['AdvocateType'] || []
        },
        'common-masters': {
          'StateInfo': mockMDMSData['StateInfo'] || [],
          'uiHomePage': mockMDMSData['uiHomePage'] || [],
          'Department': mockMDMSData['Department'] || [],
          'Designation': mockMDMSData['Designation'] || [],
          'wfSlaConfig': mockMDMSData['wfSlaConfig'] || []
        },
        'tenant': {
          'tenants': Array.isArray(mockMDMSData['tenants']) ? mockMDMSData['tenants'] : [],
          'citymodule': Array.isArray(mockMDMSData['citymodule']) ? mockMDMSData['citymodule'] : [],
          'cities': Array.isArray(mockMDMSData['cities']) ? mockMDMSData['cities'] : []
        },
        'DIGIT-UI': {
          'ApiCachingSettings': mockMDMSData['ApiCachingSettings'] || []
        }
      };

      return res.status(200).json({
        ResponseInfo: {
          apiId: 'Rainmaker',
          ver: '1.0',
          ts: new Date().toISOString(),
          resMsgId: generateUUID(),
          msgId: req.body?.RequestInfo?.msgId || req.query.msgId || '20170310130900|en_IN',
          status: 'successful'
        },
        MdmsRes: {
          [tenantId]: result
        }
      });
    }

    const result = {};
    
    MdmsCriteria.moduleDetails.forEach(module => {
      const moduleName = module.moduleName;
      const masterNames = module.masterDetails || [];
      
      result[moduleName] = {};
      
      masterNames.forEach(master => {
        const masterName = master.name || master;
        if (mockMDMSData[masterName]) {
          // Ensure arrays are always arrays (critical for hooks that call .sort())
          const data = mockMDMSData[masterName];
          result[moduleName][masterName] = Array.isArray(data) ? data : (data || []);
        } else {
          // Return empty array for unknown masters
          result[moduleName][masterName] = [];
        }
      });
      
      // If no master details specified, return all available masters for the module
      if (masterNames.length === 0) {
        if (moduleName === 'common-masters') {
          result[moduleName] = {
            'StateInfo': mockMDMSData['StateInfo'] || [],
            'uiHomePage': mockMDMSData['uiHomePage'] || [],
            'Department': mockMDMSData['Department'] || [],
            'Designation': mockMDMSData['Designation'] || [],
            'wfSlaConfig': mockMDMSData['wfSlaConfig'] || []
          };
        } else if (moduleName === 'tenant') {
          // Ensure cities and tenants are always arrays (critical for useTenants hook)
          const tenants = Array.isArray(mockMDMSData['tenants']) ? mockMDMSData['tenants'] : [];
          const cities = Array.isArray(mockMDMSData['cities']) ? mockMDMSData['cities'] : [];
          const citymodule = Array.isArray(mockMDMSData['citymodule']) ? mockMDMSData['citymodule'] : [];
          
          result[moduleName] = {
            'tenants': tenants,
            'citymodule': citymodule,
            'cities': cities
          };
          
          console.log('[MOCK API MDMS] tenant module - cities count:', cities.length);
          console.log('[MOCK API MDMS] tenant module - cities is array:', Array.isArray(cities));
        } else if (moduleName === 'DIGIT-UI') {
          result[moduleName] = {
            'ApiCachingSettings': mockMDMSData['ApiCachingSettings'] || []
          };
        } else if (moduleName === 'AdvocateRegistry') {
          result[moduleName] = {
            'AdvocateType': mockMDMSData['AdvocateType'] || []
          };
        }
      }
    });

    // Ensure tenant.cities is always an array before sending response (critical for useTenants hook)
    if (result.tenant) {
      // Ensure cities is always an array
      if (!Array.isArray(result.tenant.cities)) {
        console.error('[MOCK API MDMS] ERROR: tenant.cities is not an array!', typeof result.tenant.cities);
        result.tenant.cities = Array.isArray(mockMDMSData['cities']) ? mockMDMSData['cities'] : [];
      }
      // Ensure tenants is always an array
      if (!Array.isArray(result.tenant.tenants)) {
        console.error('[MOCK API MDMS] ERROR: tenant.tenants is not an array!', typeof result.tenant.tenants);
        result.tenant.tenants = Array.isArray(mockMDMSData['tenants']) ? mockMDMSData['tenants'] : [];
      }
      // Ensure citymodule is always an array
      if (!Array.isArray(result.tenant.citymodule)) {
        result.tenant.citymodule = Array.isArray(mockMDMSData['citymodule']) ? mockMDMSData['citymodule'] : [];
      }
    } else {
      // If tenant module doesn't exist, create it with cities array
      console.log('[MOCK API MDMS] tenant module missing, creating it');
      result.tenant = {
        'tenants': Array.isArray(mockMDMSData['tenants']) ? mockMDMSData['tenants'] : [],
        'citymodule': Array.isArray(mockMDMSData['citymodule']) ? mockMDMSData['citymodule'] : [],
        'cities': Array.isArray(mockMDMSData['cities']) ? mockMDMSData['cities'] : []
      };
    }
    
    console.log('[MOCK API MDMS] Final result structure:', JSON.stringify(result, null, 2));
    console.log('[MOCK API MDMS] tenant.cities:', result.tenant?.cities);
    console.log('[MOCK API MDMS] tenant.cities is array:', Array.isArray(result.tenant?.cities));
    console.log('[MOCK API MDMS] tenant.cities length:', result.tenant?.cities?.length);
    
    res.status(200).json({
      ResponseInfo: {
        apiId: 'Rainmaker',
        ver: '1.0',
        ts: new Date().toISOString(),
        resMsgId: generateUUID(),
        msgId: req.body?.RequestInfo?.msgId || req.query.msgId || '20170310130900|en_IN',
        status: 'successful'
      },
      MdmsRes: {
        [tenantId]: result
      }
    });
  } catch (error) {
    res.status(400).json({
      ResponseInfo: {
        apiId: 'Rainmaker',
        ver: '1.0',
        ts: new Date().toISOString(),
        resMsgId: generateUUID(),
        msgId: req.body?.RequestInfo?.msgId || req.query.msgId || '20170310130900|en_IN',
        status: 'failed'
      },
      Errors: [{
        code: 'MDMS_SEARCH_FAILED',
        message: error.message
      }]
    });
  }
};

// Add Individual and User handlers to mockApiHandlers
mockApiHandlers.createIndividual = (req, res) => {
    try {
      const body = req.body || {};
      const { RequestInfo, Individual: bodyIndividual, individuals } = body;
      const requestInfo = RequestInfo || body?.requestInfo;

      // Support both Individual (singular) and individuals (array) as in DIGIT API
      const Individual = bodyIndividual || (Array.isArray(individuals) && individuals.length > 0 ? individuals[0] : null);

      if (!Individual) {
        return res.status(400).json({
          ResponseInfo: createResponseInfo(requestInfo, 'failed'),
          Errors: [{
            code: 'INDIVIDUAL_CREATE_FAILED',
            message: 'Individual object is required',
            description: 'Individual or individuals array must be provided in the request body'
          }]
        });
      }

      const nameStr = typeof Individual.name === 'string'
        ? Individual.name
        : (Individual.name && (Individual.name.givenName || Individual.name.familyName))
          ? [Individual.name.givenName, Individual.name.familyName].filter(Boolean).join(' ')
          : '';

      if (!Individual.tenantId || !nameStr || !Individual.mobileNumber) {
        return res.status(400).json({
          ResponseInfo: createResponseInfo(requestInfo, 'failed'),
          Errors: [{
            code: 'INDIVIDUAL_CREATE_FAILED',
            message: 'Required fields missing',
            description: 'tenantId, name, and mobileNumber are required fields'
          }]
        });
      }

      const existing = mockIndividuals.find(
        ind => ind.mobileNumber === Individual.mobileNumber &&
               ind.tenantId === Individual.tenantId
      );
      if (existing) {
        return res.status(400).json({
          ResponseInfo: createResponseInfo(requestInfo, 'failed'),
          Errors: [{
            code: 'INDIVIDUAL_CREATE_FAILED',
            message: 'Mobile number already exists',
            description: `An individual with mobile number ${Individual.mobileNumber} already exists`
          }]
        });
      }

      const individualId = generateUUID();

      const newIndividual = {
        id: individualId,
        tenantId: Individual.tenantId,
        name: nameStr,
        firstName: Individual.firstName || (nameStr.split(' ')[0] || ''),
        lastName: Individual.lastName || (nameStr.split(' ').slice(1).join(' ') || ''),
        mobileNumber: Individual.mobileNumber,
        emailId: Individual.emailId || '',
        dateOfBirth: Individual.dateOfBirth || null,
        gender: Individual.gender || null,
        fatherName: Individual.fatherName || null,
        motherName: Individual.motherName || null,
        address: Individual.address || [],
        identifiers: Individual.identifiers || [],
        isActive: Individual.isActive !== undefined ? Individual.isActive : true,
        auditDetails: createAuditDetails(),
        additionalDetails: Individual.additionalDetails || {}
      };

      mockIndividuals.push(newIndividual);

      res.status(201).json({
        ResponseInfo: createResponseInfo(requestInfo),
        Individual: newIndividual,
        individuals: [newIndividual]
      });
    } catch (error) {
      res.status(400).json({
        ResponseInfo: createResponseInfo(req.body?.RequestInfo || req.body?.requestInfo, 'failed'),
        Errors: [{
          code: 'INDIVIDUAL_CREATE_FAILED',
          message: error.message,
          description: error.message
        }]
      });
    }
  };

mockApiHandlers.searchIndividuals = (req, res) => {
    try {
      const { RequestInfo, Individual } = req.body;
      const requestInfo = RequestInfo || req.body?.requestInfo;
      const criteria = Individual || {};

      let results = [...mockIndividuals];

      // Apply search criteria
      if (criteria.id) {
        results = results.filter(ind => ind.id === criteria.id);
      }
      if (criteria.tenantId) {
        results = results.filter(ind => ind.tenantId === criteria.tenantId);
      }
      if (criteria.mobileNumber) {
        results = results.filter(ind => ind.mobileNumber === criteria.mobileNumber);
      }
      if (criteria.emailId) {
        results = results.filter(ind => ind.emailId === criteria.emailId);
      }
      if (criteria.name) {
        const nameLower = criteria.name.toLowerCase();
        results = results.filter(ind => 
          ind.name.toLowerCase().includes(nameLower) ||
          (ind.firstName && ind.firstName.toLowerCase().includes(nameLower)) ||
          (ind.lastName && ind.lastName.toLowerCase().includes(nameLower))
        );
      }
      if (criteria.isActive !== undefined) {
        results = results.filter(ind => ind.isActive === criteria.isActive);
      } else {
        // Filter out inactive by default
        results = results.filter(ind => ind.isActive !== false);
      }

      res.status(200).json({
        ResponseInfo: createResponseInfo(requestInfo),
        Individual: results
      });
    } catch (error) {
      res.status(400).json({
        ResponseInfo: createResponseInfo(req.body?.RequestInfo || req.body?.requestInfo, 'failed'),
        Errors: [{
          code: 'INDIVIDUAL_SEARCH_FAILED',
          message: error.message,
          description: error.message
        }]
      });
    }
  };

mockApiHandlers.registerIndividual = (req, res) => {
    try {
      const { IndividualRegister } = req.body;
      const requestInfo = req.body?.RequestInfo || {};

      if (!IndividualRegister) {
        return res.status(400).json({
          ResponseInfo: createResponseInfo(requestInfo, 'failed'),
          Errors: [{
            code: 'INDIVIDUAL_REGISTER_FAILED',
            message: 'IndividualRegister object is required',
            description: 'IndividualRegister object must be provided in the request body'
          }]
        });
      }

      // Validate required fields
      if (!IndividualRegister.tenantId || !IndividualRegister.name || !IndividualRegister.mobileNumber) {
        return res.status(400).json({
          ResponseInfo: createResponseInfo(requestInfo, 'failed'),
          Errors: [{
            code: 'INDIVIDUAL_REGISTER_FAILED',
            message: 'Required fields missing',
            description: 'tenantId, name, and mobileNumber are required fields'
          }]
        });
      }

      // Check if mobile number already exists
      const existing = mockIndividuals.find(
        ind => ind.mobileNumber === IndividualRegister.mobileNumber && 
               ind.tenantId === IndividualRegister.tenantId
      );
      if (existing) {
        return res.status(200).json({
          ResponseInfo: createResponseInfo(requestInfo),
          Individual: existing,
          message: 'Individual already registered'
        });
      }

      const individualId = generateUUID();

      const newIndividual = {
        id: individualId,
        tenantId: IndividualRegister.tenantId,
        name: IndividualRegister.name,
        firstName: IndividualRegister.name.split(' ')[0],
        lastName: IndividualRegister.name.split(' ').slice(1).join(' ') || '',
        mobileNumber: IndividualRegister.mobileNumber,
        emailId: IndividualRegister.emailId || '',
        dateOfBirth: IndividualRegister.dateOfBirth || null,
        gender: IndividualRegister.gender || null,
        isActive: true,
        auditDetails: createAuditDetails(),
        additionalDetails: {}
      };

      mockIndividuals.push(newIndividual);

      res.status(201).json({
        ResponseInfo: createResponseInfo(requestInfo),
        Individual: newIndividual
      });
    } catch (error) {
      res.status(400).json({
        ResponseInfo: createResponseInfo(req.body?.RequestInfo || {}, 'failed'),
        Errors: [{
          code: 'INDIVIDUAL_REGISTER_FAILED',
          message: error.message,
          description: error.message
        }]
      });
    }
  };

mockApiHandlers.sendOTP = (req, res) => {
    try {
      // Handle different request body formats
      const otpData = req.body?.otp || req.body || {};
      const tenantId = req.query.tenantId || otpData.tenantId || 'dev';

      // Check if otpData is valid and has required fields
      if (!otpData || (typeof otpData !== 'object')) {
        return res.status(400).json({
          ResponseInfo: createResponseInfo({}, 'failed'),
          Errors: [{
            code: 'OTP_SEND_FAILED',
            message: 'Invalid request body format',
            description: 'Request body must contain otp object with mobileNumber or userName'
          }]
        });
      }

      if (!otpData.mobileNumber && !otpData.userName) {
        return res.status(400).json({
          ResponseInfo: createResponseInfo({}, 'failed'),
          Errors: [{
            code: 'OTP_SEND_FAILED',
            message: 'Mobile number or username is required',
            description: 'Either mobileNumber or userName must be provided in otp object'
          }]
        });
      }

      const mobileNumber = otpData.mobileNumber || otpData.userName;
      
      // Generate a 6-digit OTP
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      
      // Store OTP (valid for 10 minutes)
      mockOTPs[mobileNumber] = {
        otp: otp,
        expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
        tenantId: tenantId
      };

      // OTP console: single line in mock server (devs see OTP in terminal only)
      console.log(`🔐 [MOCK API] OTP for ${mobileNumber}: ${otp}  (expires ${new Date(mockOTPs[mobileNumber].expiresAt).toLocaleTimeString()})`);

      res.status(200).json({
        ResponseInfo: createResponseInfo({}, 'successful'),
        OtpResponse: {
          otp: otp, // In production, this wouldn't be returned
          mobileNumber: mobileNumber,
          tenantId: tenantId
        }
      });
    } catch (error) {
      res.status(400).json({
        ResponseInfo: createResponseInfo({}, 'failed'),
        Errors: [{
          code: 'OTP_SEND_FAILED',
          message: error.message,
          description: error.message
        }]
      });
    }
  };

mockApiHandlers.createCitizenUser = (req, res) => {
    try {
      // Accept either User (legacy) or UserRequest (frontend sends this)
      const rawUser = req.body.UserRequest || req.body.User;
      const tenantId = req.query.tenantId || rawUser?.tenantId || 'dev';

      if (!rawUser) {
        return res.status(400).json({
          ResponseInfo: createResponseInfo({}, 'failed'),
          Errors: [{
            code: 'USER_CREATE_FAILED',
            message: 'User object is required',
            description: 'User object or UserRequest must be provided in the request body'
          }]
        });
      }

      // Normalize: UserRequest uses userName/mobileNumber, User uses username
      const username = rawUser.userName || rawUser.username || rawUser.mobileNumber;
      const name = rawUser.name;

      // Validate required fields
      if (!name || !username) {
        return res.status(400).json({
          ResponseInfo: createResponseInfo({}, 'failed'),
          Errors: [{
            code: 'USER_CREATE_FAILED',
            message: 'Required fields missing',
            description: 'name and userName/username/mobileNumber are required fields'
          }]
        });
      }

      // Check if user already exists
      const existing = mockUsers.find(
        u => (u.userName === username || u.username === username || u.mobileNumber === username) && u.tenantId === tenantId
      );
      if (existing) {
        return res.status(400).json({
          ResponseInfo: createResponseInfo({}, 'failed'),
          Errors: [{
            code: 'USER_CREATE_FAILED',
            message: 'User already exists',
            description: `A user with username ${username} already exists`
          }]
        });
      }

      // Validate OTP if provided
      const otpReference = rawUser.otpReference;
      if (otpReference) {
        const mobileNumber = username;
        const storedOTP = mockOTPs[mobileNumber];

        if (!storedOTP || storedOTP.otp !== otpReference) {
          return res.status(400).json({
            ResponseInfo: createResponseInfo({}, 'failed'),
            Errors: [{
              code: 'USER_CREATE_FAILED',
              message: 'Invalid OTP',
              description: 'The provided OTP is invalid or expired'
            }]
          });
        }

        // Check if OTP expired
        if (Date.now() > storedOTP.expiresAt) {
          delete mockOTPs[mobileNumber];
          return res.status(400).json({
            ResponseInfo: createResponseInfo({}, 'failed'),
            Errors: [{
              code: 'USER_CREATE_FAILED',
              message: 'OTP expired',
              description: 'The provided OTP has expired. Please request a new OTP.'
            }]
          });
        }

        // OTP validated, remove it
        delete mockOTPs[mobileNumber];
      }

      const userId = generateUUID();
      const uuid = generateUUID();
      const numericId = userNumericId++; // Numeric ID for backend compatibility

      const newUser = {
        id: numericId, // Numeric ID for backend (Long type)
        uuid: uuid,
        username: username,
        userName: username,
        name: name,
        mobileNumber: rawUser.mobileNumber || username,
        emailId: rawUser.emailId || '',
        tenantId: tenantId,
        type: rawUser.type || 'CITIZEN',
        roles: rawUser.roles || [{
          code: 'CITIZEN',
          name: 'Citizen'
        }],
        active: true,
        accountLocked: false,
        accountLockedDate: null,
        lastModifiedDate: new Date().toISOString(),
        createdDate: new Date().toISOString()
      };

      mockUsers.push(newUser);

      res.status(201).json({
        ResponseInfo: createResponseInfo({}, 'successful'),
        UserRequest: newUser
      });
    } catch (error) {
      res.status(400).json({
        ResponseInfo: createResponseInfo({}, 'failed'),
        Errors: [{
          code: 'USER_CREATE_FAILED',
          message: error.message,
          description: error.message
        }]
      });
    }
  };

mockApiHandlers.getCitizenUser = (req, res) => {
    try {
      const tenantId = req.query.tenantId || 'dev';
      const mobileNumber = req.query.mobileNumber || req.query.username;

      if (!mobileNumber) {
        return res.status(400).json({
          ResponseInfo: createResponseInfo({}, 'failed'),
          Errors: [{
            code: 'USER_SEARCH_FAILED',
            message: 'Mobile number or username is required',
            description: 'mobileNumber or username query parameter is required'
          }]
        });
      }

      const user = mockUsers.find(
        u => (u.username === mobileNumber || u.mobileNumber === mobileNumber) && 
             u.tenantId === tenantId
      );

      if (!user) {
        return res.status(404).json({
          ResponseInfo: createResponseInfo({}, 'failed'),
          Errors: [{
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            description: `No user found with mobile number ${mobileNumber}`
          }]
        });
      }

      res.status(200).json({
        ResponseInfo: createResponseInfo({}, 'successful'),
        UserRequest: user
      });
    } catch (error) {
      res.status(400).json({
        ResponseInfo: createResponseInfo({}, 'failed'),
        Errors: [{
          code: 'USER_SEARCH_FAILED',
          message: error.message,
          description: error.message
        }]
      });
    }
  };

// POST /user/oauth/token - OAuth Token Authentication
mockApiHandlers.oauthToken = (req, res) => {
  try {
    // Parse form data (application/x-www-form-urlencoded)
    const username = req.body.username || req.query.username;
    const password = req.body.password || req.query.password; // This is the OTP
    const tenantId = req.body.tenantId || req.query.tenantId || 'dev';
    const userType = req.body.userType || req.query.userType || 'citizen';

    if (!username || !password) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "username and password are required"
      });
    }

    // Validate OTP
    const storedOTP = mockOTPs[username];
    const DEV_BYPASS_OTP = '123456'; // For local testing when mock sends random OTP to console only
    const otpValid = storedOTP && (storedOTP.otp === password || password === DEV_BYPASS_OTP);

    if (!otpValid) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Invalid login credentials"
      });
    }

    // Check if OTP expired (skip for dev bypass)
    if (password !== DEV_BYPASS_OTP && Date.now() > storedOTP.expiresAt) {
      delete mockOTPs[username];
      return res.status(400).json({
        error: "invalid_request",
        error_description: "OTP expired. Please request a new OTP."
      });
    }

    // OTP validated, remove it
    delete mockOTPs[username];

    // Find or create user
    let user = mockUsers.find(
      u => (u.username === username || u.mobileNumber === username) && 
           u.tenantId === tenantId
    );

    if (!user) {
      // Create user if doesn't exist (auto-register on first login)
      const userId = generateUUID();
      const uuid = generateUUID();
      const numericId = userNumericId++; // Numeric ID for backend compatibility
      user = {
        id: numericId, // Numeric ID for backend (Long type)
        uuid: uuid,
        userName: username,
        name: username, // Default name, can be updated later
        mobileNumber: username,
        emailId: '',
        tenantId: tenantId,
        type: userType.toUpperCase(),
        roles: [{
          code: userType.toUpperCase(),
          name: userType.charAt(0).toUpperCase() + userType.slice(1),
          tenantId: tenantId
        }],
        active: true,
        accountLocked: false,
        accountLockedDate: null,
        lastModifiedDate: new Date().toISOString(),
        createdDate: new Date().toISOString()
      };
      mockUsers.push(user);
    }

    // Generate mock tokens
    const accessToken = `mock_access_token_${generateUUID()}`;
    const refreshToken = `mock_refresh_token_${generateUUID()}`;

    res.status(200).json({
      ResponseInfo: createResponseInfo({}, 'successful'),
      UserRequest: user,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
      expires_in: 3600 // 1 hour
    });
  } catch (error) {
    res.status(400).json({
      error: "invalid_request",
      error_description: error.message || "Invalid login credentials"
      });
    }
  };

// POST /tenant-management/tenant/config/_search - Search Tenant Config
mockApiHandlers.searchTenantConfig = (req, res) => {
    try {
      const code = req.query.code || req.body?.code || 'dev';
      const tenantId = code;

      // Find tenant from mock data or create default
      let tenant = mockMDMSData['tenants'].find(t => t.code === tenantId);
      
      // Return mock tenant config
      const tenantConfig = {
        code: tenantId,
        name: tenant?.name || tenantId.toUpperCase(),
        i18nKey: tenant?.i18nKey || `TENANT_TENANTS_${tenantId.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`,
        description: tenant?.description || `Tenant configuration for ${tenantId}`,
        logoId: null,
        imageId: null,
        domainUrl: tenant?.domainUrl || `https://${tenantId}.digit.org`,
        type: "CITY",
        state: tenant?.state || 'Karnataka',
        district: tenant?.district || 'Bangalore Urban',
        twitterUrl: null,
        facebookUrl: null,
        emailId: `contact@${tenantId}.digit.org`,
        address: "Mock Address",
        contactNumber: "1234567890",
        helpLineNumber: "1800-123-4567",
        languages: ["en_IN", "hi_IN"],
        documents: [],
        city: tenant?.city || {
          name: tenantId.toUpperCase(),
          code: tenantId,
          districtCode: tenantId,
          districtName: tenantId.toUpperCase(),
          regionName: tenantId.toUpperCase(),
          ulbGrade: "A"
        },
        active: true
      };

      res.status(200).json({
        ResponseInfo: createResponseInfo({}, 'successful'),
        tenantConfigs: [tenantConfig]
      });
    } catch (error) {
      res.status(400).json({
        ResponseInfo: createResponseInfo({}, 'failed'),
        Errors: [{
          code: 'TENANT_CONFIG_SEARCH_FAILED',
          message: error.message,
          description: error.message
        }]
      });
    }
  };

// GET/POST /egov-location/location/v11/boundarys/_search - Boundary/Locality search
// Used by Digit.Hooks.useBoundaryLocalities(). Prevents ECONNRESET when proxy hits unified-dev.digit.org.
mockApiHandlers.searchBoundaries = (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.body?.tenantId || "dev";
    const boundaryType = req.query.boundaryType || req.body?.boundaryType || "Locality";
    const mockLocalities = [
      { id: "1", tenantId, code: "locality_1", name: "Locality 1", label: "Locality 1" },
      { id: "2", tenantId, code: "locality_2", name: "Locality 2", label: "Locality 2" },
      { id: "3", tenantId, code: "locality_3", name: "Locality 3", label: "Locality 3" },
    ];
    res.status(200).json({
      ResponseInfo: createResponseInfo(req.body?.RequestInfo || {}, "successful"),
      Boundary: mockLocalities,
    });
  } catch (error) {
    res.status(400).json({
      ResponseInfo: createResponseInfo({}, "failed"),
      Errors: [{ code: "BOUNDARY_SEARCH_FAILED", message: error.message }],
    });
  }
};

// POST /tenant-management/tenant/_search - Search Tenants
// Used by Digit.Hooks.useTenants(). Response must have { ResponseInfo, Tenants: [] }.
// If the hook sends a state-level code (e.g. "pb", "mz") with no matching tenant, we return all tenants so dropdowns get data.
mockApiHandlers.searchTenants = (req, res) => {
    try {
      console.log('[MOCK API] searchTenants called');
      console.log('[MOCK API] Request query:', req.query);
      console.log('[MOCK API] Request body:', req.body);
      
      const code = req.query.code || req.body?.code || req.body?.SearchCriteria?.code;
      const includeSubTenants = req.query.includeSubTenants !== 'false' && req.body?.includeSubTenants !== false;

      console.log('[MOCK API] Code:', code);
      console.log('[MOCK API] Include sub-tenants:', includeSubTenants);

      let tenants = [];
      const allActiveTenants = mockMDMSData['tenants'] ? mockMDMSData['tenants'].filter(t => t.active !== false) : [];

      // If no code specified, return all active tenants (for useTenants hook)
      if (!code) {
        tenants = allActiveTenants;
        console.log('[MOCK API] Returning all tenants (no code), count:', tenants.length);
      } else {
        // Find tenant from mock data by exact code match
        const exactMatch = allActiveTenants.find(t => t.code === code);

        if (exactMatch) {
          tenants = [exactMatch];
          if (includeSubTenants) {
            const subTenants = allActiveTenants.filter(t => t.code !== code && t.code.startsWith(code + '.'));
            tenants.push(...subTenants);
          }
          console.log('[MOCK API] Returning tenant by code match, count:', tenants.length);
        } else {
          // Code is likely a state-level id (e.g. "pb", "mz", "ka") - return ALL tenants
          // so useTenants() gets a full list for address/city dropdowns
          tenants = allActiveTenants;
          console.log('[MOCK API] Code not found (state-level?); returning all tenants, count:', tenants.length);
        }
      }

      console.log('[MOCK API] Returning tenants:', tenants.length);
      console.log('[MOCK API] Sample tenant:', tenants[0]);
      
      // Ensure Tenants is always an array (even if empty)
      const tenantsArray = Array.isArray(tenants) ? tenants : [];
      
      // Ensure all tenants have required properties
      const sanitizedTenants = tenantsArray.map(t => ({
        ...t,
        code: t.code || '',
        name: t.name || '',
        i18nKey: t.i18nKey || t.code || '',
        state: t.state || '',
        district: t.district || '',
        active: t.active !== false
      }));
      
      // Ensure response always has Tenants as an array (critical for hook)
      const response = {
        ResponseInfo: createResponseInfo({}, 'successful'),
        Tenants: Array.isArray(sanitizedTenants) ? sanitizedTenants : []
      };
      
      // Double-check Tenants is always an array
      if (!Array.isArray(response.Tenants)) {
        console.error('[MOCK API] ERROR: Tenants is not an array!', typeof response.Tenants);
        response.Tenants = [];
      }
      
      console.log('[MOCK API] Response structure:', JSON.stringify(response, null, 2));
      console.log('[MOCK API] Tenants array length:', response.Tenants.length);
      console.log('[MOCK API] Tenants is array:', Array.isArray(response.Tenants));
      console.log('[MOCK API] Tenants type:', typeof response.Tenants);
      
      res.status(200).json(response);
    } catch (error) {
      res.status(400).json({
        ResponseInfo: createResponseInfo({}, 'failed'),
        Errors: [{
          code: 'TENANT_SEARCH_FAILED',
          message: error.message,
          description: error.message
        }]
      });
    }
  };

// POST /user/_search - Search Users
mockApiHandlers.searchUsers = (req, res) => {
  try {
    const requestInfo = req.body?.RequestInfo || {};
    const searchCriteria = req.body || {};
    const tenantId = req.query.tenantId || searchCriteria.tenantId || 'dev';

    let results = [...mockUsers];

    // Apply search criteria
    if (searchCriteria.userName) {
      results = results.filter(u => u.userName === searchCriteria.userName);
    }
    if (searchCriteria.mobileNumber) {
      results = results.filter(u => u.mobileNumber === searchCriteria.mobileNumber);
    }
    if (searchCriteria.id) {
      results = results.filter(u => u.id === parseInt(searchCriteria.id) || u.uuid === searchCriteria.id);
    }
    if (searchCriteria.uuid) {
      results = results.filter(u => u.uuid === searchCriteria.uuid);
    }
    if (searchCriteria.name) {
      const nameLower = searchCriteria.name.toLowerCase();
      results = results.filter(u => u.name.toLowerCase().includes(nameLower));
    }
    if (searchCriteria.emailId) {
      results = results.filter(u => u.emailId === searchCriteria.emailId);
    }
    if (searchCriteria.tenantId) {
      results = results.filter(u => u.tenantId === searchCriteria.tenantId);
    }
    if (searchCriteria.type) {
      results = results.filter(u => u.type === searchCriteria.type);
    }
    if (searchCriteria.active !== undefined) {
      results = results.filter(u => u.active === searchCriteria.active);
    } else {
      // Filter out inactive by default
      results = results.filter(u => u.active !== false);
    }

    // Convert to response format with numeric IDs
    const formattedResults = results.map(user => ({
      ...user,
      id: user.id // Keep numeric ID
    }));

    res.status(200).json({
      ResponseInfo: createResponseInfo(requestInfo, 'successful'),
      User: formattedResults,
      pageSize: searchCriteria.pageSize || 100,
      totalCount: formattedResults.length
    });
  } catch (error) {
    res.status(400).json({
      ResponseInfo: createResponseInfo(req.body?.RequestInfo || {}, 'failed'),
      Errors: [{
        code: 'USER_SEARCH_FAILED',
        message: error.message,
        description: error.message
      }]
    });
  }
};

// POST /egov-user-event/v1/events/_search - Search Events/Notifications
mockApiHandlers.searchEvents = (req, res) => {
  try {
    const requestInfo = req.body?.RequestInfo || {};
    const searchCriteria = req.body || {};
    const tenantId = req.query.tenantId || searchCriteria.tenantId || 'dev';

    // Return empty events array by default (no notifications/events)
    // This prevents errors when the app tries to fetch events
    const events = [];

    res.status(200).json({
      ResponseInfo: createResponseInfo(requestInfo, 'successful'),
      events: events,
      totalCount: 0
    });
  } catch (error) {
    res.status(400).json({
      ResponseInfo: createResponseInfo(req.body?.RequestInfo || {}, 'failed'),
      Errors: [{
        code: 'EVENTS_SEARCH_FAILED',
        message: error.message,
        description: error.message
      }]
    });
  }
};

// POST /egov-user-event/v1/events/notifications/_count - Get Notification Count
mockApiHandlers.getNotificationCount = (req, res) => {
  try {
    const requestInfo = req.body?.RequestInfo || {};
    const tenantId = req.query.tenantId || req.body?.tenantId || 'dev';

    res.status(200).json({
      ResponseInfo: createResponseInfo(requestInfo, 'successful'),
      response: {
        count: 0
      }
    });
  } catch (error) {
    res.status(400).json({
      ResponseInfo: createResponseInfo(req.body?.RequestInfo || {}, 'failed'),
      Errors: [{
        code: 'NOTIFICATION_COUNT_FAILED',
        message: error.message,
        description: error.message
      }]
    });
  }
};

// POST /access/v1/actions/mdms/_get - Get Access Control Actions
mockApiHandlers.getAccessControl = (req, res) => {
  try {
    const requestInfo = req.body?.RequestInfo || {};
    const roleCodes = req.body?.roleCodes || [];
    const tenantId = req.body?.tenantId || req.query.tenantId || 'dev';
    const actionMaster = req.body?.actionMaster || 'actions-test';
    const enabled = req.body?.enabled !== false;

    // Return empty actions object by default (not array)
    // Actions are typically keyed by action code as an object
    // This allows the app to proceed without access control restrictions in mock mode
    const actions = {};

    res.status(200).json({
      ResponseInfo: createResponseInfo(requestInfo, 'successful'),
      actions: actions
    });
  } catch (error) {
    res.status(400).json({
      ResponseInfo: createResponseInfo(req.body?.RequestInfo || {}, 'failed'),
      Errors: [{
        code: 'ACCESS_CONTROL_FAILED',
        message: error.message,
        description: error.message
      }]
    });
  }
};

// In-memory storage for workflow instances
let mockWorkflows = [];

// POST /egov-workflow-v2/egov-wf/process/_transition - Workflow state transition
mockApiHandlers.workflowTransition = (req, res) => {
  try {
    const requestInfo = req.body?.RequestInfo || {};
    const processInstances = req.body?.ProcessInstances || [];
    
    if (!processInstances || processInstances.length === 0) {
      return res.status(400).json({
        ResponseInfo: createResponseInfo(requestInfo, 'failed'),
        Errors: [{
          code: 'WORKFLOW_TRANSITION_FAILED',
          message: 'ProcessInstances array is required',
          description: 'At least one process instance must be provided'
        }]
      });
    }

    const updatedInstances = processInstances.map(instance => {
      const businessId = instance.businessId;
      const action = instance.action || 'Register';
      const comment = instance.comment || '';
      const assignee = instance.assignee || null;
      
      // Find existing workflow or create new
      let workflow = mockWorkflows.find(w => w.businessId === businessId);
      
      if (!workflow) {
        workflow = {
          id: generateUUID(),
          businessId: businessId,
          businessService: instance.businessService || 'AdvocateRegistration',
          tenantId: instance.tenantId || 'dev',
          state: {
            uuid: generateUUID(),
            state: 'User Registration Requested'
          },
          action: action,
          assignee: assignee,
          comments: comment ? [{ comment: comment, userId: assignee || 'system' }] : [],
          createdTime: Date.now(),
          lastModifiedTime: Date.now()
        };
        mockWorkflows.push(workflow);
      } else {
        // Update workflow state based on action
        let nextState = 'User Registration Requested';
        if (action === 'Approve' || action === 'APPROVE') {
          nextState = 'User Registered';
        } else if (action === 'Reject' || action === 'REJECT') {
          nextState = 'User Rejected';
        }
        
        workflow.state = {
          uuid: workflow.state.uuid || generateUUID(),
          state: nextState
        };
        workflow.action = action;
        workflow.lastModifiedTime = Date.now();
        if (comment) {
          workflow.comments = workflow.comments || [];
          workflow.comments.push({
            comment: comment,
            userId: assignee || 'system',
            time: Date.now()
          });
        }
      }

      return {
        id: workflow.id,
        businessId: workflow.businessId,
        businessService: workflow.businessService,
        tenantId: workflow.tenantId,
        state: workflow.state,
        action: workflow.action,
        assignee: workflow.assignee
      };
    });

    res.status(200).json({
      ResponseInfo: createResponseInfo(requestInfo, 'successful'),
      ProcessInstances: updatedInstances
    });
  } catch (error) {
    res.status(400).json({
      ResponseInfo: createResponseInfo(req.body?.RequestInfo || {}, 'failed'),
      Errors: [{
        code: 'WORKFLOW_TRANSITION_FAILED',
        message: error.message,
        description: error.message
      }]
    });
  }
};

// POST /egov-workflow-v2/egov-wf/process/_search - Search workflow instances
mockApiHandlers.workflowSearch = (req, res) => {
  try {
    const requestInfo = req.body?.RequestInfo || {};
    const criteria = req.body?.criteria || {};
    const tenantId = criteria.tenantId || 'dev';
    const businessIds = criteria.businessIds || [];
    const businessService = criteria.businessService || 'AdvocateRegistration';

    let results = mockWorkflows.filter(w => 
      w.tenantId === tenantId && 
      w.businessService === businessService
    );

    if (businessIds.length > 0) {
      results = results.filter(w => businessIds.includes(w.businessId));
    }

    res.status(200).json({
      ResponseInfo: createResponseInfo(requestInfo, 'successful'),
      ProcessInstances: results
    });
  } catch (error) {
    res.status(400).json({
      ResponseInfo: createResponseInfo(req.body?.RequestInfo || {}, 'failed'),
      Errors: [{
        code: 'WORKFLOW_SEARCH_FAILED',
        message: error.message,
        description: error.message
      }]
    });
  }
};

// GET/POST /egov-workflow-v2/egov-wf/businessservice/_search - Search business service configuration
mockApiHandlers.businessServiceSearch = (req, res) => {
  try {
    const requestInfo = req.body?.RequestInfo || {};
    const tenantId = req.query?.tenantId || req.body?.tenantId || 'dev';
    const businessServices = req.query?.businessServices || req.body?.businessServices || 'AdvocateRegistration';
    
    // Parse businessServices if it's a comma-separated string
    const businessServiceArray = Array.isArray(businessServices) 
      ? businessServices 
      : businessServices.split(',').map(s => s.trim());
    
    // Mock business service configuration for AdvocateRegistration
    const businessServiceConfig = {
      businessService: 'AdvocateRegistration',
      tenantId: tenantId,
      states: [
        {
          uuid: generateUUID(),
          state: 'User Registration Requested',
          applicationStatus: 'PENDING',
          isStartState: true,
          isTerminateState: false,
          sla: null,
          actions: [
            {
              uuid: generateUUID(),
              action: 'APPROVE',
              nextState: 'APPROVED',
              roles: ['EMPLOYEE', 'ADMIN'],
              active: true
            },
            {
              uuid: generateUUID(),
              action: 'REJECT',
              nextState: 'REJECTED',
              roles: ['EMPLOYEE', 'ADMIN'],
              active: true
            }
          ],
          active: true
        },
        {
          uuid: generateUUID(),
          state: 'APPROVED',
          applicationStatus: 'APPROVED',
          isStartState: false,
          isTerminateState: true,
          sla: null,
          actions: [],
          active: true
        },
        {
          uuid: generateUUID(),
          state: 'REJECTED',
          applicationStatus: 'REJECTED',
          isStartState: false,
          isTerminateState: true,
          sla: null,
          actions: [],
          active: true
        }
      ],
      active: true
    };
    
    // Filter by requested business services
    const filteredBusinessServices = businessServiceArray
      .filter(bs => bs === 'AdvocateRegistration')
      .map(() => businessServiceConfig);
    
    res.status(200).json({
      ResponseInfo: createResponseInfo(requestInfo, 'successful'),
      BusinessServices: filteredBusinessServices
    });
  } catch (error) {
    res.status(400).json({
      ResponseInfo: createResponseInfo(req.body?.RequestInfo || {}, 'failed'),
      Errors: [{
        code: 'BUSINESS_SERVICE_SEARCH_FAILED',
        message: error.message,
        description: error.message
      }]
    });
  }
};

// POST /egov-idgen/id/_generate - Generate IDs
mockApiHandlers.generateId = (req, res) => {
  try {
    const requestInfo = req.body?.RequestInfo || {};
    const idRequests = req.body?.idRequests || [];
    
    if (!idRequests || idRequests.length === 0) {
      return res.status(400).json({
        ResponseInfo: createResponseInfo(requestInfo, 'failed'),
        Errors: [{
          code: 'ID_GENERATION_FAILED',
          message: 'idRequests array is required',
          description: 'At least one ID request must be provided'
        }]
      });
    }

    const idResponses = idRequests.map(request => {
      const tenantId = request.tenantId || 'dev';
      const idName = request.idName || '';
      
      let generatedId;
      
      if (idName === 'advocate.application.number' || idName.includes('advocate.application')) {
        const year = new Date().getFullYear();
        const seq = String(nextId).padStart(3, '0');
        generatedId = `ADVOC_${seq}_${year}`;
        nextId++;
      } else if (idName === 'advocate.clerk.application.number' || idName.includes('advocate.clerk')) {
        const year = new Date().getFullYear();
        const seq = String(nextId).padStart(3, '0');
        generatedId = `ADVOC_CLERK_${seq}_${year}`;
        nextId++;
      } else {
        // Generic ID generation
        const year = new Date().getFullYear();
        const seq = String(nextId).padStart(6, '0');
        generatedId = `${idName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${seq}_${year}`;
        nextId++;
      }

      return {
        id: generatedId,
        idName: idName,
        tenantId: tenantId
      };
    });

    res.status(200).json({
      ResponseInfo: createResponseInfo(requestInfo, 'successful'),
      idResponses: idResponses
    });
  } catch (error) {
    res.status(400).json({
      ResponseInfo: createResponseInfo(req.body?.RequestInfo || {}, 'failed'),
      Errors: [{
        code: 'ID_GENERATION_FAILED',
        message: error.message,
        description: error.message
      }]
    });
  }
};

// Mock localization messages data
const mockLocalizationMessages = {
  'rainmaker-common': {
    'en_IN': [
      { code: 'CS_COMMON_SEARCH', message: 'Search', module: 'rainmaker-common' },
      { code: 'CS_COMMON_CLEAR_SEARCH', message: 'Clear Search', module: 'rainmaker-common' },
      { code: 'CS_COMMON_CLOSE', message: 'Close', module: 'rainmaker-common' },
      { code: 'CS_COMMON_SUBMIT', message: 'Submit', module: 'rainmaker-common' },
      { code: 'CS_COMMON_CANCEL', message: 'Cancel', module: 'rainmaker-common' },
      { code: 'CS_COMMON_SAVE', message: 'Save', module: 'rainmaker-common' },
      { code: 'CS_COMMON_EDIT', message: 'Edit', module: 'rainmaker-common' },
      { code: 'CS_COMMON_DELETE', message: 'Delete', module: 'rainmaker-common' },
      { code: 'CS_COMMON_VIEW', message: 'View', module: 'rainmaker-common' },
      { code: 'CS_COMMON_ADD', message: 'Add', module: 'rainmaker-common' },
      { code: 'CS_COMMON_BACK', message: 'Back', module: 'rainmaker-common' },
      { code: 'CS_COMMON_NEXT', message: 'Next', module: 'rainmaker-common' },
      { code: 'CS_COMMON_PREVIOUS', message: 'Previous', module: 'rainmaker-common' },
      { code: 'CS_COMMON_CONTINUE', message: 'Continue', module: 'rainmaker-common' },
      { code: 'CS_COMMON_PROCEED', message: 'Proceed', module: 'rainmaker-common' },
      { code: 'CS_COMMON_REQUIRED_FIELD', message: 'This field is required', module: 'rainmaker-common' },
      { code: 'CS_COMMON_INVALID_INPUT', message: 'Invalid input', module: 'rainmaker-common' },
      { code: 'CS_COMMON_ERROR', message: 'Error', module: 'rainmaker-common' },
      { code: 'CS_COMMON_SUCCESS', message: 'Success', module: 'rainmaker-common' },
      { code: 'CS_COMMON_LOADING', message: 'Loading...', module: 'rainmaker-common' }
    ]
  },
  'digit-ui': {
    'en_IN': [
      { code: 'DIGIT_UI_HOME', message: 'Home', module: 'digit-ui' },
      { code: 'DIGIT_UI_DASHBOARD', message: 'Dashboard', module: 'digit-ui' },
      { code: 'DIGIT_UI_PROFILE', message: 'Profile', module: 'digit-ui' },
      { code: 'DIGIT_UI_SETTINGS', message: 'Settings', module: 'digit-ui' },
      { code: 'DIGIT_UI_LOGOUT', message: 'Logout', module: 'digit-ui' },
      { code: 'DIGIT_UI_LOGIN', message: 'Login', module: 'digit-ui' },
      { code: 'DIGIT_UI_REGISTER', message: 'Register', module: 'digit-ui' },
      { code: 'DIGIT_UI_WELCOME', message: 'Welcome', module: 'digit-ui' },
      { code: 'DIGIT_UI_NO_DATA', message: 'No data available', module: 'digit-ui' },
      { code: 'DIGIT_UI_LOADING', message: 'Loading...', module: 'digit-ui' }
    ]
  },
  'digit-tenants': {
    'en_IN': [
      { code: 'TENANT_TENANTS_DEV', message: 'Development', module: 'digit-tenants' },
      { code: 'TENANT_TENANTS_KA_BANGALORE', message: 'Bangalore', module: 'digit-tenants' },
      { code: 'TENANT_TENANTS_MH_MUMBAI', message: 'Mumbai', module: 'digit-tenants' },
      { code: 'TENANT_TENANTS_TN_CHENNAI', message: 'Chennai', module: 'digit-tenants' }
    ]
  },
  'rainmaker-dev': {
    'en_IN': [
      { code: 'RAINMAKER_DEV_MODULE', message: 'Development Module', module: 'rainmaker-dev' }
    ]
  }
};

// POST /localization/messages/v1/_search - Search Localization Messages
mockApiHandlers.searchLocalization = (req, res) => {
  try {
    console.log('[MOCK API LOCALIZATION] searchLocalization called');
    console.log('[MOCK API LOCALIZATION] Request query:', req.query);
    console.log('[MOCK API LOCALIZATION] Request body:', req.body);
    
    // Extract parameters from query string or body
    const moduleParam = req.query.module || req.body?.module || '';
    const locale = req.query.locale || req.body?.locale || 'en_IN';
    const tenantId = req.query.tenantId || req.body?.tenantId || 'dev';
    const codes = req.query.codes || req.body?.codes || null;
    
    console.log('[MOCK API LOCALIZATION] Module:', moduleParam);
    console.log('[MOCK API LOCALIZATION] Locale:', locale);
    console.log('[MOCK API LOCALIZATION] TenantId:', tenantId);
    
    // Parse comma-separated modules
    const modules = moduleParam ? moduleParam.split(',').map(m => m.trim()) : [];
    
    // Collect all messages from requested modules
    let allMessages = [];
    
    modules.forEach(moduleName => {
      const moduleMessages = mockLocalizationMessages[moduleName];
      if (moduleMessages && moduleMessages[locale]) {
        allMessages = allMessages.concat(moduleMessages[locale]);
      }
    });
    
    // If no modules specified, return empty array
    if (modules.length === 0) {
      console.log('[MOCK API LOCALIZATION] No modules specified, returning empty array');
      allMessages = [];
    }
    
    // Filter by codes if specified
    if (codes) {
      const codeArray = Array.isArray(codes) ? codes : codes.split(',').map(c => c.trim());
      allMessages = allMessages.filter(msg => codeArray.includes(msg.code));
    }
    
    console.log('[MOCK API LOCALIZATION] Returning', allMessages.length, 'messages');
    
    // Return response in the expected format
    res.status(200).json({
      ResponseInfo: createResponseInfo({}, 'successful'),
      messages: allMessages
    });
  } catch (error) {
    console.error('[MOCK API LOCALIZATION] Error:', error);
    res.status(400).json({
      ResponseInfo: createResponseInfo({}, 'failed'),
      Errors: [{
        code: 'LOCALIZATION_SEARCH_FAILED',
        message: error.message,
        description: error.message
      }]
    });
  }
};

// Middleware to handle mock API requests
function mockApiMiddleware(req, res, next) {
  // Normalize path - remove app base path (digit-ui, workbench-ui, api) so API routes match
  // Use req.originalUrl or req.url to get full path including query params
  let path = req.path || req.originalUrl?.split('?')[0] || req.url?.split('?')[0] || '';
  path = path.replace(/^\/digit-ui/, '') || path;
  path = path.replace(/^\/workbench-ui/, '') || path;
  path = path.replace(/^\/api/, '') || path;
  path = path || '/';
  const method = req.method;

  // Debug: Log tenant search requests (app may use /digit-ui or /workbench-ui as context path)
  if (path.includes('tenant') && path.includes('search')) {
    console.log('[MOCK API MIDDLEWARE] Tenant search:', { path, method, originalUrl: req.originalUrl, query: req.query });
  }

  // Handle advocate endpoints
  if (path.startsWith('/advocate/v1/')) {
    if (path === '/advocate/v1/_create' && method === 'POST') {
      return mockApiHandlers.createAdvocate(req, res);
    } else if (path === '/advocate/v1/_update' && method === 'POST') {
      return mockApiHandlers.updateAdvocate(req, res);
    } else if (path === '/advocate/v1/_search' && method === 'POST') {
      return mockApiHandlers.searchAdvocates(req, res);
    }
  }

  // Handle Location/Boundary endpoints (avoids proxy ECONNRESET to unified-dev.digit.org)
  if ((path === '/egov-location/location/v11/boundarys/_search' || path === '/egov-location/location/v11/boundaries/_search') && (method === 'POST' || method === 'GET')) {
    return mockApiHandlers.searchBoundaries(req, res);
  }

  // Handle MDMS endpoints (both GET and POST)
  if (path === '/egov-mdms-service/v1/_search' && (method === 'POST' || method === 'GET')) {
    return mockApiHandlers.searchMDMS(req, res);
  }

  // Handle Individual registry endpoints (match by prefix so any path like /individual/v1/_create is caught)
  if (path.includes('/individual/v1/')) {
    if ((path === '/individual/v1/_create' || path.endsWith('/individual/v1/_create')) && method === 'POST') {
      return mockApiHandlers.createIndividual(req, res);
    } else if ((path === '/individual/v1/_search' || path.endsWith('/individual/v1/_search')) && method === 'POST') {
      return mockApiHandlers.searchIndividuals(req, res);
    } else if ((path === '/individual/v1/_register' || path.endsWith('/individual/v1/_register')) && method === 'POST') {
      return mockApiHandlers.registerIndividual(req, res);
    }
  }

  // Handle User OTP endpoints
  if (path === '/user-otp/v1/_send' && method === 'POST') {
    return mockApiHandlers.sendOTP(req, res);
  }

  // Handle User/Citizen endpoints
  if (path === '/user/citizen/_create') {
    if (method === 'POST') {
      return mockApiHandlers.createCitizenUser(req, res);
    } else if (method === 'GET') {
      return mockApiHandlers.getCitizenUser(req, res);
    }
  }

  // Handle OAuth Token endpoint
  if (path === '/user/oauth/token' && method === 'POST') {
    return mockApiHandlers.oauthToken(req, res);
  }

  // Handle Tenant Management endpoints
  if (path === '/tenant-management/tenant/config/_search' && (method === 'POST' || method === 'GET')) {
    return mockApiHandlers.searchTenantConfig(req, res);
  }
  if (path === '/tenant-management/tenant/_search' && (method === 'POST' || method === 'GET')) {
    return mockApiHandlers.searchTenants(req, res);
  }

  // Handle User Search endpoint
  if (path === '/user/_search' && method === 'POST') {
    return mockApiHandlers.searchUsers(req, res);
  }

  // Handle Events/User Event endpoints
  if (path === '/egov-user-event/v1/events/_search' && (method === 'POST' || method === 'GET')) {
    return mockApiHandlers.searchEvents(req, res);
  }
  if (path === '/egov-user-event/v1/events/notifications/_count' && (method === 'POST' || method === 'GET')) {
    return mockApiHandlers.getNotificationCount(req, res);
  }

    // Handle Access Control endpoints
  if (path === '/access/v1/actions/mdms/_get' && (method === 'POST' || method === 'GET')) {
    return mockApiHandlers.getAccessControl(req, res);
  }

  // Handle Workflow endpoints
  if (path === '/egov-workflow-v2/egov-wf/process/_transition' && method === 'POST') {
    return mockApiHandlers.workflowTransition(req, res);
  }
  if (path === '/egov-workflow-v2/egov-wf/process/_search' && method === 'POST') {
    return mockApiHandlers.workflowSearch(req, res);
  }
  if (path === '/egov-workflow-v2/egov-wf/businessservice/_search' && (method === 'GET' || method === 'POST')) {
    return mockApiHandlers.businessServiceSearch(req, res);
  }

  // Handle IDGen endpoints
  if (path === '/egov-idgen/id/_generate' && method === 'POST') {
    return mockApiHandlers.generateId(req, res);
  }

  // Handle Localization endpoints
  // Match both exact path and path that starts with /localization/messages/v1/_search
  if ((path === '/localization/messages/v1/_search' || path.startsWith('/localization/messages/v1/_search')) && (method === 'GET' || method === 'POST')) {
    console.log('[MOCK API MIDDLEWARE] Intercepting localization request:', path);
    return mockApiHandlers.searchLocalization(req, res);
  }

  // If not a mock endpoint, continue to next middleware
  next();
}

/**
 * Log mock API server status (enabled / middleware registered).
 * Use this from setupProxy so all API console output lives in the mock server.
 */
const logMockApiEnabled = () => {
  console.log("✅ Mock API Server enabled in setupProxy - requests will be intercepted");
};

const logMockApiMiddlewareRegistered = () => {
  console.log("📡 Mock API middleware registered in setupProxy");
};

const logMockApiLoadError = (message) => {
  console.warn("⚠️  Could not load mock API server:", message);
};

module.exports = {
  mockApiMiddleware,
  mockApiHandlers,
  logMockApiEnabled,
  logMockApiMiddlewareRegistered,
  logMockApiLoadError,
  // Export for testing/resetting
  resetMockData: () => {
    mockAdvocates = [];
    mockIndividuals = [];
    mockUsers = [];
    mockOTPs = {};
    mockWorkflows = [];
    nextId = 1;
    individualNextId = 1;
    userNextId = 1;
    userNumericId = 1000;
  },
  getMockAdvocates: () => mockAdvocates,
  getMockIndividuals: () => mockIndividuals,
  getMockUsers: () => mockUsers,
  getMockOTPs: () => mockOTPs,
  getMockMDMSData: () => mockMDMSData,
  getMockWorkflows: () => mockWorkflows
};
