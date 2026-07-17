/** Validate email format */
export function validateEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Validate password — min 6 chars */
export function validatePassword(password = '') {
  return password.length >= 6;
}

/** Validate username — alphanumeric, min 3 chars */
export function validateUsername(username = '') {
  return /^[a-zA-Z0-9_]{3,}$/.test(username.trim());
}

/** Check if a value is non-empty string */
export function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Validate phone number (Vietnamese format) */
export function validatePhone(phone = '') {
  return /^(\+84|0)[3-9]\d{8}$/.test(phone.trim());
}
