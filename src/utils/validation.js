export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

export function validateEmail(value) {
  if (!value?.trim()) return 'Email is required.';
  if (!emailRegex.test(value.trim())) return 'Please enter a valid email address.';
  return '';
}

export function validateEmailOrPhone(value) {
  if (!value?.trim()) return 'Email or phone is required.';
  const trimmed = value.trim();
  if (emailRegex.test(trimmed)) return '';
  const normalizedPhone = normalizePhone(trimmed);
  if (normalizedPhone.length >= 10 && normalizedPhone.length <= 13) return '';
  return 'Please enter a valid email address or phone number.';
}

export function validatePassword(value) {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
    return 'Password must include at least one uppercase letter and one number.';
  }
  return '';
}

export function validateName(value, fieldName = 'Name') {
  if (!value?.trim()) return `${fieldName} is required.`;
  if (!/^[A-Za-z\s.'-]+$/.test(value.trim())) return `${fieldName} can only contain letters and basic punctuation.`;
  return '';
}

export function validatePhone(value) {
  if (!value?.trim()) return 'Contact number is required.';
  const normalized = value.replace(/\D/g, '');
  if (normalized.length < 10 || normalized.length > 13) return 'Please enter a valid phone number.';
  return '';
}

export function validateRequired(value, fieldName) {
  if (!value?.toString().trim()) return `${fieldName} is required.`;
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
  if (!value?.trim()) return 'Plate number is required.';
  if (!/^[A-Za-z0-9\s-]{2,20}$/.test(value.trim())) return 'Plate number can only contain letters, numbers, spaces, and hyphens.';
  return '';
}
