const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    initializeMFA,
    verifyMFASetup,
    verifyMFA,
    disableMFA,
    getMFAStatus,
    regenerateBackupCodes
} = require("../controller/MFAController");

// Get MFA status for logged-in user
router.get("/status", protect, getMFAStatus);

// Initialize MFA setup (generate QR code)
router.post("/initialize", protect, initializeMFA);

// Verify MFA setup and enable MFA
router.post("/verify-setup", protect, verifyMFASetup);

// Verify MFA token during login (public route for login flow)
router.post("/verify/:userId", verifyMFA);

// Disable MFA (requires password confirmation)
router.post("/disable", protect, disableMFA);

// Regenerate backup codes (requires password confirmation)
router.post("/regenerate-backup-codes", protect, regenerateBackupCodes);

module.exports = router;
