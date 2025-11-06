/**
 * Input validation utilities for Admin settings
 * Prevents negative values and symbols in numeric input fields
 */

/**
 * Validates and sanitizes numeric input to prevent negative values and symbols
 * @param {string} value - The input value to validate
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum allowed value (default: 0)
 * @param {number} options.max - Maximum allowed value (default: Infinity)
 * @param {boolean} options.allowDecimals - Whether to allow decimal values (default: false)
 * @returns {string} - Sanitized value
 */
export const validateNumericInput = (value, options = {}) => {
  const {
    min = 0,
    max = Infinity,
    allowDecimals = false
  } = options;

  // Remove all non-numeric characters except decimal point if allowed
  let sanitized = value.replace(/[^0-9.]/g, '');
  
  // If decimals not allowed, remove decimal points
  if (!allowDecimals) {
    sanitized = sanitized.replace(/\./g, '');
  }
  
  // Remove multiple decimal points, keep only the first one
  if (allowDecimals) {
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
  }
  
  // Convert to number for validation
  const numericValue = parseFloat(sanitized);
  
  // If empty or invalid, return empty string
  if (isNaN(numericValue) || sanitized === '') {
    return '';
  }
  
  // Ensure value is not negative
  if (numericValue < min) {
    return min.toString();
  }
  
  // Ensure value is not greater than max
  if (numericValue > max) {
    return max.toString();
  }
  
  return sanitized;
};

/**
 * Validates phone number input (allows only digits, spaces, +, -, (, ))
 * @param {string} value - The input value to validate
 * @returns {string} - Sanitized phone number
 */
export const validatePhoneInput = (value) => {
  // Allow only digits, spaces, +, -, (, )
  return value.replace(/[^0-9\s+\-()]/g, '');
};

/**
 * Validates zip code input (allows only alphanumeric characters and hyphens)
 * @param {string} value - The input value to validate
 * @returns {string} - Sanitized zip code
 */
export const validateZipCodeInput = (value) => {
  // Allow only alphanumeric characters and hyphens
  return value.replace(/[^0-9A-Za-z\-]/g, '');
};

/**
 * Validates GPS coordinates (latitude/longitude)
 * @param {string} value - The input value to validate
 * @param {string} type - 'latitude' or 'longitude'
 * @returns {string} - Sanitized coordinate
 */
export const validateGPSCoordinate = (value, type) => {
  // Remove all non-numeric characters except decimal point and minus sign
  let sanitized = value.replace(/[^0-9.\-]/g, '');
  
  // Remove multiple decimal points
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Remove multiple minus signs, keep only the first one at the beginning
  if (sanitized.includes('-')) {
    const minusIndex = sanitized.indexOf('-');
    if (minusIndex > 0) {
      sanitized = sanitized.replace(/-/g, '');
    } else {
      sanitized = '-' + sanitized.replace(/-/g, '');
    }
  }
  
  const numericValue = parseFloat(sanitized);
  
  if (isNaN(numericValue) || sanitized === '') {
    return '';
  }
  
  // Validate latitude range (-90 to 90)
  if (type === 'latitude' && (numericValue < -90 || numericValue > 90)) {
    return numericValue < -90 ? '-90' : '90';
  }
  
  // Validate longitude range (-180 to 180)
  if (type === 'longitude' && (numericValue < -180 || numericValue > 180)) {
    return numericValue < -180 ? '-180' : '180';
  }
  
  return sanitized;
};

/**
 * Validates tax rate input (allows only positive numbers with up to 2 decimal places)
 * @param {string} value - The input value to validate
 * @returns {string} - Sanitized tax rate
 */
export const validateTaxRate = (value) => {
  // Remove all non-numeric characters except decimal point
  let sanitized = value.replace(/[^0-9.]/g, '');
  
  // Remove multiple decimal points
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit to 2 decimal places
  if (sanitized.includes('.')) {
    const [integer, decimal] = sanitized.split('.');
    if (decimal && decimal.length > 2) {
      sanitized = integer + '.' + decimal.substring(0, 2);
    }
  }
  
  const numericValue = parseFloat(sanitized);
  
  if (isNaN(numericValue) || sanitized === '') {
    return '';
  }
  
  // Ensure value is not negative
  if (numericValue < 0) {
    return '0';
  }
  
  // Limit to reasonable tax rate (max 100%)
  if (numericValue > 100) {
    return '100';
  }
  
  return sanitized;
};

/**
 * Validates IP address input
 * @param {string} value - The input value to validate
 * @returns {string} - Sanitized IP address
 */
export const validateIPAddress = (value) => {
  // Allow only digits and dots
  return value.replace(/[^0-9.]/g, '');
};
