import React from "react";
import PropTypes from "prop-types";
import styles from "./RoleOptionGroup.module.scss";

/**
 * Reusable radio group for options with a label and description per option.
 * Use for role selection or any list of options where each has a title and description.
 *
 * @param {Object[]} options - Array of { value, name, description }
 * @param {string} value - Currently selected option value
 * @param {Function} onChange - Called with (value) when selection changes
 * @param {string} [name='role'] - name attribute for the radio inputs
 * @param {string} [ariaLabel] - Accessible name for the radiogroup
 * @param {string} [idPrefix='option'] - Prefix for id/aria-describedby (e.g. 'role' -> role-{value})
 */
const RoleOptionGroup = ({
  options = [],
  value,
  onChange,
  name = "role",
  ariaLabel,
  idPrefix = "option",
}) => {
  const getOptionClassName = (optionValue) => {
    const baseClass = styles.option;
    return value === optionValue ? `${baseClass} ${styles.selected}` : baseClass;
  };

  return (
    <div
      className={styles.root}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((option, index) => (
        <div key={option.value} className={styles.optionWrapper}>
          <label
            className={getOptionClassName(option.value)}
            htmlFor={`${idPrefix}-${option.value}`}
          >
            <input
              id={`${idPrefix}-${option.value}`}
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className={styles.radioInput}
              aria-describedby={option.description ? `${idPrefix}-desc-${option.value}` : undefined}
            />
            <span className={styles.radioCheckmark} aria-hidden="true" />
            <div className={styles.optionContent}>
              <span className={styles.optionLabel}>{option.name}</span>
              {option.description != null && option.description !== "" && (
                <span
                  id={`${idPrefix}-desc-${option.value}`}
                  className={styles.optionDescription}
                >
                  {option.description}
                </span>
              )}
            </div>
          </label>
          {index < options.length - 1 && (
            <div className={styles.divider} aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
};

RoleOptionGroup.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      name: PropTypes.node.isRequired,
      description: PropTypes.node,
    })
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string,
  ariaLabel: PropTypes.string,
  idPrefix: PropTypes.string,
};

export default RoleOptionGroup;
