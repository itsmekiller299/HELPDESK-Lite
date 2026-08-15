const CATEGORIES = ['Technical', 'Billing', 'General'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

function text(value, field, { min = 1, max = 5000 } = {}) {
  if (typeof value !== 'string') return `${field} must be text`;
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    return `${field} must be between ${min} and ${max} characters`;
  }
  return null;
}

function email(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function id(value) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

module.exports = { CATEGORIES, PRIORITIES, text, email, id };
