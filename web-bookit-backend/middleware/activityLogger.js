const ActivityLog = require("../model/ActivityLog");

// Helper function to extract IP address
const getClientIP = (req) => {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.ip ||
           'unknown';
};

// Helper function to sanitize request body (remove sensitive data)
const sanitizeRequestBody = (body) => {
    if (!body) return null;
    
    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'otp', 'token', 'authorization', 'secret'];
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });
    
    return sanitized;
};

// Main logging function
const logActivity = async ({
    userId = null,
    userEmail = null,
    userRole = null,
    action,
    description,
    req = null,
    statusCode = 200,
    resourceId = null,
    resourceType = null,
    metadata = null,
    severity = 'LOW',
    success = true,
    errorMessage = null
}) => {
    try {
        const logData = {
            userId,
            userEmail,
            userRole,
            action,
            description,
            statusCode,
            resourceId,
            resourceType,
            metadata,
            severity,
            success,
            errorMessage,
            timestamp: new Date()
        };

        if (req) {
            logData.ipAddress = getClientIP(req);
            logData.userAgent = req.headers['user-agent'] || 'unknown';
            logData.requestMethod = req.method;
            logData.requestUrl = req.originalUrl || req.url;
            logData.requestBody = sanitizeRequestBody(req.body);
            logData.sessionId = req.sessionID || req.headers['session-id'] || null;
        }

        const activityLog = new ActivityLog(logData);
        await activityLog.save();
        
        console.log(`📊 Activity logged: ${action} by ${userEmail || 'anonymous'}`);
    } catch (error) {
        console.error('❌ Failed to log activity:', error);
        // Don't throw error to avoid breaking the main application flow
    }
};

// Middleware to automatically log requests
const activityLogger = (action, options = {}) => {
    return (req, res, next) => {
        // Store original response methods
        const originalSend = res.send;
        const originalJson = res.json;
        
        // Override response methods to capture status
        res.send = function(data) {
            logRequestActivity(req, res, action, data, options);
            return originalSend.call(this, data);
        };
        
        res.json = function(data) {
            logRequestActivity(req, res, action, data, options);
            return originalJson.call(this, data);
        };
        
        next();
    };
};

// Helper function for request-based logging
const logRequestActivity = async (req, res, action, responseData, options) => {
    try {
        const { 
            description, 
            resourceType, 
            getResourceId, 
            getSeverity,
            getMetadata 
        } = options;
        
        const user = req.user || null;
        const statusCode = res.statusCode;
        const success = statusCode >= 200 && statusCode < 400;
        
        let resourceId = null;
        if (getResourceId && typeof getResourceId === 'function') {
            resourceId = getResourceId(req, responseData);
        } else if (req.params && req.params.id) {
            resourceId = req.params.id;
        }
        
        let severity = 'LOW';
        if (getSeverity && typeof getSeverity === 'function') {
            severity = getSeverity(req, res, responseData);
        } else if (!success) {
            severity = statusCode >= 500 ? 'CRITICAL' : 'MEDIUM';
        }
        
        let metadata = null;
        if (getMetadata && typeof getMetadata === 'function') {
            metadata = getMetadata(req, res, responseData);
        }
        
        await logActivity({
            userId: user ? user._id : null,
            userEmail: user ? user.email : null,
            userRole: user ? user.role : null,
            action,
            description: description || `${action} action performed`,
            req,
            statusCode,
            resourceId,
            resourceType,
            metadata,
            severity,
            success,
            errorMessage: !success && responseData ? responseData.message || responseData.error : null
        });
    } catch (error) {
        console.error('❌ Failed to log request activity:', error);
    }
};

// Specific logging functions for common actions
const logUserAuthentication = async (action, user, req, success = true, errorMessage = null) => {
    await logActivity({
        userId: user ? user._id : null,
        userEmail: user ? user.email : null,
        userRole: user ? user.role : null,
        action,
        description: `User ${action.toLowerCase().replace('_', ' ')}`,
        req,
        statusCode: success ? 200 : 401,
        resourceType: 'USER',
        resourceId: user ? user._id.toString() : null,
        severity: success ? 'LOW' : 'MEDIUM',
        success,
        errorMessage
    });
};

const logDataAccess = async (action, user, req, resourceType, resourceId = null, metadata = null) => {
    await logActivity({
        userId: user ? user._id : null,
        userEmail: user ? user.email : null,
        userRole: user ? user.role : null,
        action,
        description: `User accessed ${resourceType.toLowerCase()} data`,
        req,
        resourceType,
        resourceId,
        metadata,
        severity: 'LOW',
        success: true
    });
};

const logDataModification = async (action, user, req, resourceType, resourceId = null, metadata = null) => {
    await logActivity({
        userId: user ? user._id : null,
        userEmail: user ? user.email : null,
        userRole: user ? user.role : null,
        action,
        description: `User ${action.toLowerCase().replace('_', ' ')} ${resourceType.toLowerCase()}`,
        req,
        resourceType,
        resourceId,
        metadata,
        severity: 'MEDIUM',
        success: true
    });
};

const logSecurityEvent = async (action, user, req, description, severity = 'HIGH') => {
    await logActivity({
        userId: user ? user._id : null,
        userEmail: user ? user.email : null,
        userRole: user ? user.role : null,
        action,
        description,
        req,
        resourceType: 'SYSTEM',
        severity,
        success: false
    });
};

module.exports = {
    logActivity,
    activityLogger,
    logUserAuthentication,
    logDataAccess,
    logDataModification,
    logSecurityEvent,
    getClientIP,
    sanitizeRequestBody
};
