import DOMPurify from 'dompurify';

/**
 * Sanitize input to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @param {Object} options - DOMPurify configuration options
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input, options = {}) => {
    if (typeof input !== 'string') {
        return input;
    }
    
    // Default configuration for text inputs (strips all HTML)
    const defaultConfig = {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
        ...options
    };
    
    return DOMPurify.sanitize(input, defaultConfig);
};

/**
 * Sanitize HTML content (allows safe HTML tags)
 * @param {string} html - The HTML string to sanitize
 * @returns {string} - Sanitized HTML string
 */
export const sanitizeHTML = (html) => {
    if (typeof html !== 'string') {
        return html;
    }
    
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target'],
        ALLOW_DATA_ATTR: false
    });
};

/**
 * Create a sanitized input change handler
 * @param {Function} setter - State setter function
 * @param {Object} options - Sanitization options
 * @returns {Function} - Input change handler
 */
export const createSanitizedHandler = (setter, options = {}) => {
    return (e) => {
        const sanitizedValue = sanitizeInput(e.target.value, options);
        setter(sanitizedValue);
    };
};

/**
 * Sanitize form data object
 * @param {Object} formData - Form data object
 * @param {Array} excludeFields - Fields to exclude from sanitization
 * @returns {Object} - Sanitized form data
 */
export const sanitizeFormData = (formData, excludeFields = []) => {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(formData)) {
        if (excludeFields.includes(key)) {
            sanitized[key] = value;
        } else if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value);
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
};
