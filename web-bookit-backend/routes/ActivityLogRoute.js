const express = require("express");
const router = express.Router();
const { protect, staff } = require("../middleware/authMiddleware");
const {
    getActivityLogs,
    getUserActivityLogs,
    getActivityStats,
    getActivitySummary,
    deleteOldLogs,
    exportActivityLogs
} = require("../controller/ActivityLogController");

// Admin middleware to ensure only admin users can access activity logs
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ message: "Access denied, admin only" });
    }
};

// Get all activity logs (Admin only)
router.get("/", protect, adminOnly, getActivityLogs);

// Get activity logs for a specific user (Admin only)
router.get("/user/:userId", protect, adminOnly, getUserActivityLogs);

// Get activity statistics (Admin only)
router.get("/stats", protect, adminOnly, getActivityStats);

// Get activity summary for dashboard (Admin only)
router.get("/summary", protect, adminOnly, getActivitySummary);

// Export activity logs (Admin only)
router.get("/export", protect, adminOnly, exportActivityLogs);

// Delete old activity logs (Admin only)
router.delete("/cleanup", protect, adminOnly, deleteOldLogs);

module.exports = router;
