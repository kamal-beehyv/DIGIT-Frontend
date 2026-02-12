/**
 * Shared dummy state / city / tenant data used when MDMS or tenant API
 * returns no data or fails. Keeps AddressScreen and AdvocateVerification
 * in sync with the same options.
 */

/** Dummy tenants for AddressScreen (state, district, city dropdowns). */
export const DUMMY_TENANTS = [
  { code: "ka.bangalore", name: "Bangalore", i18nKey: "TENANT_TENANTS_KA_BANGALORE", state: "Karnataka", district: "Bangalore Urban" },
  { code: "ka.mysore", name: "Mysore", i18nKey: "TENANT_TENANTS_KA_MYSORE", state: "Karnataka", district: "Mysore" },
  { code: "mh.mumbai", name: "Mumbai", i18nKey: "TENANT_TENANTS_MH_MUMBAI", state: "Maharashtra", district: "Mumbai" },
  { code: "mh.pune", name: "Pune", i18nKey: "TENANT_TENANTS_MH_PUNE", state: "Maharashtra", district: "Pune" },
  { code: "tn.chennai", name: "Chennai", i18nKey: "TENANT_TENANTS_TN_CHENNAI", state: "Tamil Nadu", district: "Chennai" },
  { code: "dl.delhi", name: "Delhi", i18nKey: "TENANT_TENANTS_DL_DELHI", state: "Delhi", district: "New Delhi" },
  { code: "dev", name: "Development", i18nKey: "TENANT_TENANTS_DEV", state: "Karnataka", district: "Bangalore Urban" },
];

/** Dummy states for AdvocateVerification (State of registration dropdown). Same states as in DUMMY_TENANTS. */
export const DUMMY_STATES = [
  { code: "karnataka", name: "Karnataka" },
  { code: "maharashtra", name: "Maharashtra" },
  { code: "tamil_nadu", name: "Tamil Nadu" },
  { code: "delhi", name: "Delhi" },
];
