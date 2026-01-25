/**
 * Utility functions for input validation
 * SECURITY: Centralized validation to prevent injection attacks and ensure data integrity
 */

/**
 * Validate UUID format
 * SECURITY: Prevents injection attacks and invalid database queries
 * RISK: Invalid UUIDs could cause database errors or expose information
 */
const isValidUUID = (uuid) => {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate multiple UUIDs
 */
const validateUUIDs = (uuids) => {
  if (!Array.isArray(uuids)) {
    return false;
  }
  return uuids.every(id => isValidUUID(id));
};

/**
 * Sanitize string input (basic)
 * SECURITY: Removes potentially dangerous characters
 * RISK: Unsanitized input could lead to injection attacks
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') {
    return str;
  }
  // Remove null bytes and control characters
  return str.replace(/[\x00-\x1F\x7F]/g, '');
};

module.exports = {
  isValidUUID,
  validateUUIDs,
  sanitizeString,
};
