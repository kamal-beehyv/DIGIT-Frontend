import React from "react";
import PropTypes from "prop-types";
import styles from "./PhoneNumberInput.module.scss";

/**
 * PhoneNumberInput Component
 * 
 * A custom phone number input component with a fixed country code (+91) display
 * and an editable phone number input field. Matches the design specification with
 * light grey background for country code and teal/green border separator.
 * 
 * @param {string} value - The phone number value
 * @param {function} onChange - Callback function called when the value changes
 * @param {string} name - Input name attribute
 * @param {string} placeholder - Placeholder text for the input
 * @param {number} maxLength - Maximum length of the phone number (default: 10)
 * @param {number} minLength - Minimum length of the phone number (default: 10)
 * @param {string} pattern - Validation pattern for the phone number
 * @param {string} countryCode - Country code to display (default: "+91")
 * @param {string} className - Additional CSS classes
 * @param {object} inputProps - Additional props to pass to the input element
 */
const PhoneNumberInput = ({
  value = "",
  onChange,
  name = "phoneNumber",
  placeholder = "Enter mobile number",
  maxLength = 10,
  minLength = 10,
  pattern = "^[6-9][0-9]{9}$",
  countryCode = "+91",
  className = "",
  inputProps = {},
  ...props
}) => {
  const handleChange = (e) => {
    const inputValue = e.target.value;
    // Clean the input - only allow digits
    const cleanedValue = String(inputValue || "").replace(/\D/g, "").slice(0, maxLength);
    
    if (onChange) {
      onChange(cleanedValue);
    }
  };

  const handleInput = (e) => {
    // Ensure only digits are entered
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, maxLength);
  };

  return (
    <div className={`${styles["phone-input-container"]} ${className}`} {...props}>
      <div className={styles["country-code-section"]}>
        <span>{countryCode}</span>
      </div>
      <input
        type="tel"
        name={name}
        value={value}
        onChange={handleChange}
        onInput={handleInput}
        placeholder={placeholder}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        className={styles["phone-number-input"]}
        {...inputProps}
      />
    </div>
  );
};

PhoneNumberInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string,
  placeholder: PropTypes.string,
  maxLength: PropTypes.number,
  minLength: PropTypes.number,
  pattern: PropTypes.string,
  countryCode: PropTypes.string,
  className: PropTypes.string,
  inputProps: PropTypes.object,
};

export default PhoneNumberInput;
