// src/utils/sanitize.js
import DOMPurify from 'dompurify';

export const sanitizeInput = (input) => {
  return DOMPurify.sanitize(input);
};