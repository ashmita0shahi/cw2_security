const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false // For unauthenticated actions
    },
    userEmail: {
        type: String,
        required: false
    },
    userRole: {
        type: String,
        required: false
    },
    action: {
        type: String,
        required: true,
        enum: [
            // Authentication actions
            'LOGIN', 'LOGOUT', 'REGISTER', 'VERIFY_EMAIL', 'RESEND_OTP',
            'LOGIN_MFA_REQUIRED', 'FAILED_LOGIN',
            
            // MFA actions
            'MFA_INIT', 'MFA_ENABLE', 'MFA_DISABLE', 'MFA_VERIFY', 'MFA_FAILED',
            'MFA_VERIFY_SETUP', 'MFA_STATUS', 'MFA_BACKUP_REGEN',
            
            // User management actions
            'VIEW_PROFILE', 'UPDATE_PROFILE', 'UPDATE_PROFILE_PICTURE',
            'VIEW_USERS', 'DELETE_USER',
            
            // Room management actions
            'CREATE_ROOM', 'UPDATE_ROOM', 'DELETE_ROOM', 'VIEW_ROOM', 'VIEW_ROOMS',
            
            // Booking management actions
            'CREATE_BOOKING', 'UPDATE_BOOKING', 'DELETE_BOOKING', 'VIEW_BOOKING', 'VIEW_BOOKINGS',
            'APPROVE_BOOKING', 'REJECT_BOOKING',
            
            // Admin actions
            'VIEW_ACTIVITY_LOGS', 'EXPORT_LOGS',
            
            // Security events
            'UNAUTHORIZED_ACCESS', 'SUSPICIOUS_ACTIVITY',
            
            // File operations
            'UPLOAD_FILE', 'DELETE_FILE',
            
            // System actions
            'ACCESS_DENIED', 'VALIDATION_ERROR'
        ]
    },
    description: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String,
        required: false
    },
    userAgent: {
        type: String,
        required: false
    },
    requestMethod: {
        type: String,
        required: false
    },
    requestUrl: {
        type: String,
        required: false
    },
    statusCode: {
        type: Number,
        required: false
    },
    resourceId: {
        type: String,
        required: false // ID of the resource being acted upon (room, booking, etc.)
    },
    resourceType: {
        type: String,
        required: false,
        enum: ['USER', 'ROOM', 'BOOKING', 'FILE', 'SYSTEM']
    },
    requestBody: {
        type: mongoose.Schema.Types.Mixed,
        required: false // Store relevant request data (excluding sensitive info)
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        required: false // Additional context-specific data
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'LOW'
    },
    success: {
        type: Boolean,
        default: true
    },
    errorMessage: {
        type: String,
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    sessionId: {
        type: String,
        required: false
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for better query performance
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ ipAddress: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ severity: 1, timestamp: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
module.exports = ActivityLog;
