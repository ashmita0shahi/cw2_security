const mongoose = require("mongoose");
const ActivityLog = require("./model/ActivityLog");
const User = require("./model/User");
const { logActivity, logUserAuthentication } = require("./middleware/activityLogger");

// Demo script to test activity logging functionality
const demoActivityLogging = async () => {
    try {
        // Connect to MongoDB (using existing connection if available)
        console.log("🔗 Testing Activity Logging System...");

        // Test 1: Log a simple activity
        console.log("\n📝 Test 1: Logging a simple activity");
        await logActivity({
            action: 'SYSTEM_TEST',
            description: 'Testing activity logging system',
            severity: 'LOW',
            success: true
        });
        console.log("✅ Simple activity logged successfully");

        // Test 2: Log user authentication
        console.log("\n📝 Test 2: Logging user authentication");
        const testUser = {
            _id: new mongoose.Types.ObjectId(),
            email: 'test@example.com',
            role: 'user'
        };
        
        const mockReq = {
            ip: '127.0.0.1',
            headers: { 'user-agent': 'Test Browser' },
            method: 'POST',
            originalUrl: '/api/users/login',
            body: { email: 'test@example.com' }
        };

        await logUserAuthentication('LOGIN', testUser, mockReq, true);
        console.log("✅ User authentication logged successfully");

        // Test 3: Log security event
        console.log("\n📝 Test 3: Logging security event");
        await logActivity({
            action: 'SUSPICIOUS_ACTIVITY',
            description: 'Multiple failed login attempts detected',
            severity: 'HIGH',
            success: false,
            ipAddress: '192.168.1.100',
            userAgent: 'Suspicious Browser',
            errorMessage: 'Brute force attempt detected'
        });
        console.log("✅ Security event logged successfully");

        // Test 4: Retrieve recent logs
        console.log("\n📝 Test 4: Retrieving recent activity logs");
        const recentLogs = await ActivityLog.find()
            .sort({ timestamp: -1 })
            .limit(5);
        
        console.log(`✅ Retrieved ${recentLogs.length} recent logs:`);
        recentLogs.forEach((log, index) => {
            console.log(`   ${index + 1}. ${log.action} - ${log.description} (${log.severity})`);
        });

        // Test 5: Activity statistics
        console.log("\n📝 Test 5: Generating activity statistics");
        const stats = {
            totalLogs: await ActivityLog.countDocuments(),
            highSeverityLogs: await ActivityLog.countDocuments({ severity: 'HIGH' }),
            successfulActions: await ActivityLog.countDocuments({ success: true }),
            failedActions: await ActivityLog.countDocuments({ success: false })
        };
        
        console.log("✅ Activity statistics:");
        console.log(`   Total logs: ${stats.totalLogs}`);
        console.log(`   High severity: ${stats.highSeverityLogs}`);
        console.log(`   Successful: ${stats.successfulActions}`);
        console.log(`   Failed: ${stats.failedActions}`);

        console.log("\n🎉 Activity logging system test completed successfully!");
        
    } catch (error) {
        console.error("❌ Error testing activity logging:", error);
    }
};

// Export for use
module.exports = { demoActivityLogging };

// Run demo if this file is executed directly
if (require.main === module) {
    const connectDB = require("./config/db");
    require("dotenv").config();
    
    connectDB().then(() => {
        demoActivityLogging().then(() => {
            console.log("\n✅ Demo completed. You can now check your MongoDB for activity logs!");
            process.exit(0);
        });
    });
}
