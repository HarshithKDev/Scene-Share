// src/utils/sanitize.js
import DOMPurify from 'dompurify';

/**
 * --- MODIFICATION ---
 * Sanitizes a string by stripping out all HTML tags.
 * This is the safest way to prevent XSS when rendering plain text.
 * @param {string} input The string to sanitize.
 * @returns {string} The sanitized, plain-text string.
 */
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // This configuration removes all HTML tags, preventing XSS.
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

/**
 * Sanitizes a room ID by removing any characters that are not
 * alphanumeric, hyphens, or underscores.
 * @param {string} input The room ID to sanitize.
 * @returns {string} The sanitized room ID.
 */
export const sanitizeRoomId = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Allow alphanumeric characters, hyphens, and underscores
  return input.replace(/[^a-zA-Z0-9_-]/g, '');
};