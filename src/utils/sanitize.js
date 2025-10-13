// src/utils/sanitize.js
import DOMPurify from 'dompurify';

export const sanitizeInput = (input) => {
  return DOMPurify.sanitize(input);
};

/**
 * --- NEW FUNCTION ---
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