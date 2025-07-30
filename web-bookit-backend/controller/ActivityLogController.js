const ActivityLog = require("../model/ActivityLog");
const User = require("../model/User");
const { logDataAccess } = require("../middleware/activityLogger");

// Get all activity logs with filtering and pagination
const getActivityLogs = async (req, res) => {
    try {
        await logDataAccess('VIEW_ACTIVITY_LOGS', req.user, req, 'SYSTEM');

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};
        
        if (req.query.userId) {
            filter.userId = req.query.userId;
        }
        
        if (req.query.action) {
            filter.action = req.query.action;
        }
        
        if (req.query.severity) {
            filter.severity = req.query.severity;
        }
        
        if (req.query.success !== undefined) {
            filter.success = req.query.success === 'true';
        }
        
        if (req.query.resourceType) {
            filter.resourceType = req.query.resourceType;
        }
        
        if (req.query.userEmail) {
            filter.userEmail = new RegExp(req.query.userEmail, 'i');
        }
        
        // Date range filtering
        if (req.query.startDate || req.query.endDate) {
            filter.timestamp = {};
            if (req.query.startDate) {
                filter.timestamp.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                filter.timestamp.$lte = new Date(req.query.endDate);
            }
        }

        // Execute query with pagination
        const logs = await ActivityLog.find(filter)
            .populate('userId', 'fullname email role')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        const totalLogs = await ActivityLog.countDocuments(filter);
        const totalPages = Math.ceil(totalLogs / limit);

        res.json({
            logs,
            pagination: {
                currentPage: page,
                totalPages,
                totalLogs,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('❌ Error fetching activity logs:', error);
        res.status(500).json({ 
            message: "Failed to fetch activity logs", 
            error: error.message 
        });
    }
};

// Get activity logs for a specific user
const getUserActivityLogs = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        await logDataAccess('VIEW_ACTIVITY_LOGS', req.user, req, 'USER', userId);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const filter = { userId };
        
        if (req.query.action) {
            filter.action = req.query.action;
        }
        
        if (req.query.startDate || req.query.endDate) {
            filter.timestamp = {};
            if (req.query.startDate) {
                filter.timestamp.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                filter.timestamp.$lte = new Date(req.query.endDate);
            }
        }

        const logs = await ActivityLog.find(filter)
            .populate('userId', 'fullname email role')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        const totalLogs = await ActivityLog.countDocuments(filter);

        res.json({
            logs,
            totalLogs,
            page,
            totalPages: Math.ceil(totalLogs / limit)
        });
    } catch (error) {
        console.error('❌ Error fetching user activity logs:', error);
        res.status(500).json({ 
            message: "Failed to fetch user activity logs", 
            error: error.message 
        });
    }
};

// Get activity statistics
const getActivityStats = async (req, res) => {
    try {
        await logDataAccess('VIEW_ACTIVITY_LOGS', req.user, req, 'SYSTEM');

        const stats = {};

        // Total logs count
        stats.totalLogs = await ActivityLog.countDocuments();

        // Logs by action
        stats.actionStats = await ActivityLog.aggregate([
            { $group: { _id: "$action", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Logs by severity
        stats.severityStats = await ActivityLog.aggregate([
            { $group: { _id: "$severity", count: { $sum: 1 } } }
        ]);

        // Success vs failure ratio
        stats.successStats = await ActivityLog.aggregate([
            { $group: { _id: "$success", count: { $sum: 1 } } }
        ]);

        // Active users (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        stats.activeUsers = await ActivityLog.distinct('userId', {
            timestamp: { $gte: thirtyDaysAgo },
            userId: { $ne: null }
        }).then(userIds => userIds.length);

        // Recent activity (last 24 hours)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        stats.recentActivity = await ActivityLog.countDocuments({
            timestamp: { $gte: twentyFourHoursAgo }
        });

        // Top IP addresses (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        stats.topIPs = await ActivityLog.aggregate([
            { $match: { timestamp: { $gte: sevenDaysAgo }, ipAddress: { $ne: null } } },
            { $group: { _id: "$ipAddress", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Security events (last 30 days)
        stats.securityEvents = await ActivityLog.countDocuments({
            timestamp: { $gte: thirtyDaysAgo },
            severity: { $in: ['HIGH', 'CRITICAL'] }
        });

        res.json(stats);
    } catch (error) {
        console.error('❌ Error fetching activity statistics:', error);
        res.status(500).json({ 
            message: "Failed to fetch activity statistics", 
            error: error.message 
        });
    }
};

// Get activity summary for dashboard
const getActivitySummary = async (req, res) => {
    try {
        await logDataAccess('VIEW_ACTIVITY_LOGS', req.user, req, 'SYSTEM');

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const summary = {
            today: await ActivityLog.countDocuments({ timestamp: { $gte: today } }),
            yesterday: await ActivityLog.countDocuments({ 
                timestamp: { $gte: yesterday, $lt: today } 
            }),
            thisWeek: await ActivityLog.countDocuments({ timestamp: { $gte: thisWeek } }),
            failedLogins: await ActivityLog.countDocuments({ 
                action: 'FAILED_LOGIN',
                timestamp: { $gte: today }
            }),
            securityAlerts: await ActivityLog.countDocuments({ 
                severity: { $in: ['HIGH', 'CRITICAL'] },
                timestamp: { $gte: today }
            })
        };

        res.json(summary);
    } catch (error) {
        console.error('❌ Error fetching activity summary:', error);
        res.status(500).json({ 
            message: "Failed to fetch activity summary", 
            error: error.message 
        });
    }
};

// Delete old activity logs (for maintenance)
const deleteOldLogs = async (req, res) => {
    try {
        const { days = 90 } = req.body; // Default to 90 days
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const result = await ActivityLog.deleteMany({
            timestamp: { $lt: cutoffDate }
        });

        await logDataAccess('DELETE_OLD_LOGS', req.user, req, 'SYSTEM', null, {
            deletedCount: result.deletedCount,
            cutoffDays: days
        });

        res.json({ 
            message: `Deleted ${result.deletedCount} old activity logs`,
            deletedCount: result.deletedCount 
        });
    } catch (error) {
        console.error('❌ Error deleting old logs:', error);
        res.status(500).json({ 
            message: "Failed to delete old logs", 
            error: error.message 
        });
    }
};

// Export activity logs (for backup/analysis)
const exportActivityLogs = async (req, res) => {
    try {
        await logDataAccess('EXPORT_LOGS', req.user, req, 'SYSTEM');

        const { format = 'json', startDate, endDate } = req.query;
        
        const filter = {};
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        const logs = await ActivityLog.find(filter)
            .populate('userId', 'fullname email role')
            .sort({ timestamp: -1 });

        if (format === 'csv') {
            // Convert to CSV format
            const csvHeader = 'Timestamp,User Email,User Role,Action,Description,IP Address,Success,Severity\n';
            const csvData = logs.map(log => 
                `"${log.timestamp}","${log.userEmail || 'N/A'}","${log.userRole || 'N/A'}","${log.action}","${log.description}","${log.ipAddress || 'N/A'}","${log.success}","${log.severity}"`
            ).join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=activity_logs.csv');
            res.send(csvHeader + csvData);
        } else {
            // JSON format
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=activity_logs.json');
            res.json(logs);
        }
    } catch (error) {
        console.error('❌ Error exporting activity logs:', error);
        res.status(500).json({ 
            message: "Failed to export activity logs", 
            error: error.message 
        });
    }
};

module.exports = {
    getActivityLogs,
    getUserActivityLogs,
    getActivityStats,
    getActivitySummary,
    deleteOldLogs,
    exportActivityLogs
};
