import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, Button, Loader } from "@egovernments/digit-ui-components";
import { LabelFieldPair, CardLabel, CardLabelError, Dropdown, LocationSearch, TextInput } from "@egovernments/digit-ui-react-components";
import { useRegistrationForm } from "../../../hooks/useRegistrationForm";
import { DUMMY_TENANTS } from "../../../constants/dummyLocationData";
import styles from "./AddressScreen.module.scss";

const AddressScreen = ({ stateCode, tenants, path }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formData, updateFormData } = useRegistrationForm();
  const [locality, setLocality] = useState(formData.address?.locality || "");
  const [doorNumber, setDoorNumber] = useState(formData.address?.doorNumber || "");
  const [city, setCity] = useState(formData.address?.city || null);
  const [state, setState] = useState(formData.address?.state || null);
  const [district, setDistrict] = useState(formData.address?.district || null);
  const [pincode, setPincode] = useState(formData.address?.pincode || "");
  const [errors, setErrors] = useState({});

  // Use same tenant id as app bootstrap (index.js): stateCode from props, then global config, then env, then "dev" so MDMS returns state/city data
  const tenantId = stateCode || window?.globalConfigs?.getConfig?.("STATE_LEVEL_TENANT_ID") || process.env.REACT_APP_STATE_LEVEL_TENANT_ID || "dev";

  // Use MDMS tenant module (egov-mdms-service/v1/_search) for state/city/district
  const { data: tenantsFromMDMS, isLoading: citiesLoading, isError: citiesError } = Digit.Hooks.useCustomMDMS(
    tenantId,
    "tenant",
    [{ name: "tenants" }],
    {
      select: (data) => {
        const list = data?.tenant?.tenants;
        return Array.isArray(list) ? list : [];
      },
    }
  );

  const normalizedCities = useMemo(() => {
    const fromApi = tenantsFromMDMS && Array.isArray(tenantsFromMDMS) ? tenantsFromMDMS : [];
    if (fromApi.length > 0) return fromApi;
    return DUMMY_TENANTS;
  }, [tenantsFromMDMS]);

  const stateId = Digit.Utils.getMultiRootTenant() ? Digit.ULBService.getStateId() : city?.code;
  const { data: fetchedLocalities } = Digit.Hooks.useBoundaryLocalities(
    stateId,
    "admin",
    {
      enabled: !!city,
    },
    t
  );

  const states = useMemo(() => {
    if (!normalizedCities || normalizedCities.length === 0) {
      return [];
    }
    const uniqueStates = new Map();
    normalizedCities.forEach((city) => {
      if (city && city.state && !uniqueStates.has(city.state)) {
        uniqueStates.set(city.state, {
          code: city.state,
          name: city.state,
          i18nKey: city.state,
        });
      }
    });
    return Array.from(uniqueStates.values());
  }, [normalizedCities]);

  const districts = useMemo(() => {
    if (!normalizedCities || normalizedCities.length === 0 || !state) return [];
    const uniqueDistricts = new Map();
    const filteredCities = normalizedCities.filter((c) => c.state === state?.code);
    filteredCities.forEach((city) => {
      if (city && city.district && !uniqueDistricts.has(city.district)) {
        uniqueDistricts.set(city.district, {
          code: city.district,
          name: city.district,
          i18nKey: city.district,
        });
      }
    });
    return Array.from(uniqueDistricts.values());
  }, [normalizedCities, state]);

  const filteredCities = useMemo(() => {
    if (!normalizedCities || normalizedCities.length === 0) return [];
    if (!district) {
      return normalizedCities.map((c) => ({ code: c.code, name: c.name, i18nKey: c.i18nKey }));
    } else {
      const filtered = normalizedCities.filter((c) => c && c.district === district?.code);
      return filtered.map((c) => ({ code: c.code, name: c.name, i18nKey: c.i18nKey }));
    }
  }, [normalizedCities, district]);

  // Load from form data if available
  useEffect(() => {
    if (formData.address) {
      if (formData.address.locality) setLocality(formData.address.locality);
      if (formData.address.doorNumber) setDoorNumber(formData.address.doorNumber);
      if (formData.address.city) setCity(formData.address.city);
      if (formData.address.state) setState(formData.address.state);
      if (formData.address.district) setDistrict(formData.address.district);
      if (formData.address.pincode) setPincode(formData.address.pincode);
    }
  }, [formData.address]);

  const updateAddressData = (updates) => {
    updateFormData({
      address: {
        ...formData.address,
        ...updates
      }
    });
  };

  const handleLocalityChange = (e) => {
    const value = e.target.value;
    setLocality(value);
    updateAddressData({ locality: value });
    if (errors.locality) {
      setErrors(prev => ({ ...prev, locality: null }));
    }
  };

  const handleDoorNumberChange = (e) => {
    const value = e.target.value;
    setDoorNumber(value);
    updateAddressData({ doorNumber: value });
    if (errors.doorNumber) {
      setErrors(prev => ({ ...prev, doorNumber: null }));
    }
  };

  const handleCityChange = (selectedCity) => {
    setCity(selectedCity);
    updateAddressData({ city: selectedCity });
    if (errors.city) {
      setErrors(prev => ({ ...prev, city: null }));
    }
  };

  const handleStateChange = (selectedState) => {
    setState(selectedState);
    setDistrict(null);
    setCity(null);
    updateAddressData({ state: selectedState, district: null, city: null });
    if (errors.state) {
      setErrors(prev => ({ ...prev, state: null }));
    }
  };

  const handleDistrictChange = (selectedDistrict) => {
    setDistrict(selectedDistrict);
    setCity(null);
    updateAddressData({ district: selectedDistrict, city: null });
    if (errors.district) {
      setErrors(prev => ({ ...prev, district: null }));
    }
  };

  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(value);
    updateAddressData({ pincode: value });
    if (errors.pincode) {
      setErrors(prev => ({ ...prev, pincode: null }));
    }
  };

  const handleLocationChange = (val, location) => {
    if (location) {
      const updates = {
        locality: location.address || locality,
        pincode: location.pincode || pincode
      };
      
      if (location.city) {
        const matchedCity = normalizedCities?.find((c) => c && (c.name === location.city || c.code === location.city));
        if (matchedCity) {
          setCity(matchedCity);
          updates.city = matchedCity;
        }
      }
      if (location.state) {
        const matchedState = states.find((s) => s.name === location.state || s.code === location.state);
        if (matchedState) {
          setState(matchedState);
          updates.state = matchedState;
        }
      }
      if (location.pincode) {
        setPincode(location.pincode);
      }
      
      setLocality(updates.locality);
      updateAddressData(updates);
    }
  };

  const validate = () => {
    const validationErrors = {};
    if (!locality || !locality.trim()) {
      validationErrors.locality = t("ERR_ADDRESS_REQUIRED") || "Locality is required";
    }
    if (!doorNumber || !doorNumber.trim()) {
      validationErrors.doorNumber = t("ERR_ADDRESS_REQUIRED") || "Door number is required";
    }
    if (!city) {
      validationErrors.city = t("ERR_ADDRESS_REQUIRED") || "City is required";
    }
    if (!state) {
      validationErrors.state = t("ERR_ADDRESS_REQUIRED") || "State is required";
    }
    if (!district) {
      validationErrors.district = t("ERR_ADDRESS_REQUIRED") || "District is required";
    }
    if (!pincode || pincode.length !== 6) {
      validationErrors.pincode = t("ERR_INVALID_PINCODE") || "Valid pincode is required";
    }
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) {
      return;
    }
    // Update form data with complete address
    updateAddressData({
      locality: locality.trim(),
      doorNumber: doorNumber.trim(),
      city,
      state,
      district,
      pincode
    });
    navigate(`${path}/register/verify-id`);
  };

  const isButtonDisabled = !locality || !city || !state || !district || !pincode || !doorNumber;

  if (citiesLoading) {
    return (
      <div className={styles["address-entry-container"]}>
        <Loader />
      </div>
    );
  }

  return (
    <div className={styles["address-entry-container"]}>
      <div className={styles["address-entry-content"]}>
        <div className={styles["address-entry-header"]}>
          <h1 className={styles["address-entry-title"]}>
            {t("ENTER_YOUR_ADDRESS")}
          </h1>
        </div>

        <Card className={styles["address-entry-card"]} noCardStyle>
          <div className={styles["address-entry-form-content"]}>
            <div className={styles["search-section"]}>
              <LocationSearch
                onChange={handleLocationChange}
                placeholder={t("SEARCH_BUILDING_STREET_AREA")}
              />
            </div>

            <div className={styles["instruction-banner"]}>
              <span className={styles["instruction-icon"]}>ℹ️</span>
              <span>{t("MOVE_PIN_INSTRUCTION")}</span>
            </div>

            <div className={styles["address-fields-grid"]}>
              <LabelFieldPair>
                <CardLabel className={styles["form-label"]}>
                  {t("PINCODE")} *
                </CardLabel>
                <div className={styles["field-container"]}>
                  <TextInput
                    value={pincode}
                    onChange={handlePincodeChange}
                    maxLength={6}
                    pattern="^[0-9]{6}$"
                  />
                </div>
              </LabelFieldPair>

              <LabelFieldPair>
                <CardLabel className={styles["form-label"]}>
                  {t("STATE")} *
                </CardLabel>
                <div className={styles["field-container"]}>
                  <Dropdown
                    option={states}
                    selected={state}
                    select={handleStateChange}
                    optionKey="i18nKey"
                    t={t}
                    isMandatory
                  />
                </div>
              </LabelFieldPair>

              <LabelFieldPair>
                <CardLabel className={styles["form-label"]}>
                  {t("DISTRICT")} *
                </CardLabel>
                <div className={styles["field-container"]}>
                  <Dropdown
                    option={districts}
                    selected={district}
                    select={handleDistrictChange}
                    optionKey="i18nKey"
                    t={t}
                    isMandatory
                    isDisabled={!state}
                  />
                </div>
              </LabelFieldPair>

              <LabelFieldPair>
                <CardLabel className={styles["form-label"]}>
                  {t("CITY_TOWN")} *
                </CardLabel>
                <div className={styles["field-container"]}>
                  <Dropdown
                    option={filteredCities}
                    selected={city}
                    select={handleCityChange}
                    optionKey="i18nKey"
                    t={t}
                    isMandatory
                    isDisabled={!district}
                  />
                </div>
              </LabelFieldPair>

              <LabelFieldPair>
                <CardLabel className={styles["form-label"]}>
                  {t("LOCALITY_STREET_AREA")} *
                </CardLabel>
                <div className={styles["field-container"]}>
                  <TextInput
                    value={locality}
                    onChange={handleLocalityChange}
                  />
                </div>
              </LabelFieldPair>

              <LabelFieldPair>
                <CardLabel className={styles["form-label"]}>
                  {t("DOOR_NUMBER")} *
                </CardLabel>
                <div className={styles["field-container"]}>
                  <TextInput
                    value={doorNumber}
                    onChange={handleDoorNumberChange}
                  />
                </div>
              </LabelFieldPair>
            </div>

            {Object.values(errors).map((error, index) => 
              error && <CardLabelError key={index}>{error}</CardLabelError>
            )}

            <div className={styles["address-entry-actions"]}>
              <Button
                label={t("CONTINUE")}
                onButtonClick={handleContinue}
                onClick={handleContinue}
                isDisabled={isButtonDisabled}
                className={styles["continue-button"]}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AddressScreen;
