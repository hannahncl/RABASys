export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizeInput(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .trim()
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '');
}

export function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

export function validateEmail(value) {
  const sanitized = sanitizeInput(value);
  if (!sanitized) return 'Email is required.';
  if (!emailRegex.test(sanitized)) return 'Please enter a valid email address.';
  return '';
}

export function validateEmailOrPhone(value) {
  const sanitized = sanitizeInput(value);
  if (!sanitized) return 'Email or phone is required.';
  if (emailRegex.test(sanitized)) return '';
  const normalizedPhone = normalizePhone(sanitized);
  if (normalizedPhone.length >= 10 && normalizedPhone.length <= 13) return '';
  return 'Please enter a valid email address or phone number.';
}

export function validatePassword(value) {
  const sanitized = sanitizeInput(value);
  if (!sanitized) return 'Password is required.';
  if (sanitized.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(sanitized)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(sanitized)) return 'Password must include at least one lowercase letter.';
  if (!/[0-9]/.test(sanitized)) return 'Password must include at least one number.';
  if (!/[^A-Za-z0-9]/.test(sanitized)) return 'Password must include at least one special character.';
  return '';
}

export function validateName(value, fieldName = 'Name') {
  const sanitized = sanitizeInput(value);
  if (!sanitized) return `${fieldName} is required.`;
  if (!/^[A-Za-z\s.'-]+$/.test(sanitized)) return `${fieldName} can only contain letters and basic punctuation.`;
  return '';
}

export function validatePhone(value) {
  const sanitized = sanitizeInput(value);
  if (!sanitized) return 'Contact number is required.';
  if (!/^[0-9+\-()\s]+$/.test(sanitized)) return 'Contact number can only contain numbers and allowed separators.';
  const normalized = sanitized.replace(/\D/g, '');
  if (normalized.length < 10 || normalized.length > 13) return 'Please enter a valid phone number.';
  return '';
}

export function validateRequired(value, fieldName) {
  const sanitized = sanitizeInput(value);
  if (!sanitized) return `${fieldName} is required.`;
  return '';
}

export function validateNumber(value, fieldName, { min = 0, max } = {}) {
  if (!value && value !== 0) return `${fieldName} is required.`;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return `${fieldName} must be a valid number.`;
  if (numericValue < min) return `${fieldName} must be at least ${min}.`;
  if (max !== undefined && numericValue > max) return `${fieldName} must be at most ${max}.`;
  return '';
}

export function validatePlateNumber(value) {
  const sanitized = sanitizeInput(value);
  if (!sanitized) return 'Plate number is required.';
  if (!/^[A-Za-z0-9\s-]{2,20}$/.test(sanitized)) return 'Plate number can only contain letters, numbers, spaces, and hyphens.';
  return '';
}
