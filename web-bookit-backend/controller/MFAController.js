const User = require("../model/User");
const { 
    generateMFASecret, 
    generateQRCode, 
    verifyMFAToken, 
    encryptSecret, 
    decryptSecret,
    generateBackupCodes,
    hashBackupCode,
    verifyBackupCode,
    removeBackupCode
} = require("../utils/mfaUtils");
const { 
    logDataAccess, 
    logDataModification, 
    logSecurityEvent 
} = require("../middleware/activityLogger");

/**
 * Initialize MFA setup for user
 */
const initializeMFA = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            await logSecurityEvent('MFA_INIT', req.user, req, 'MFA initialization for non-existent user', 'HIGH');
            return res.status(404).json({ message: "User not found" });
        }

        // Generate new MFA secret
        const { secret, otpauthUrl, manualEntryKey } = generateMFASecret(user.email);
        
        // Generate QR code
        const qrCodeDataURL = await generateQRCode(otpauthUrl);
        
        // Store encrypted secret temporarily (will be saved permanently after verification)
        user.mfaSecret = encryptSecret(secret);
        user.mfaEnabled = false; // Will be enabled after verification
        user.mfaSetupCompleted = false;
        await user.save();

        await logDataModification('MFA_INIT', req.user, req, 'USER', user._id.toString(), {
            action: 'MFA setup initialized'
        });

        res.json({
            message: "MFA setup initialized",
            qrCode: qrCodeDataURL,
            manualEntryKey: manualEntryKey,
            backupCodes: null // Will be provided after verification
        });

    } catch (error) {
        await logSecurityEvent('MFA_INIT', req.user, req, `MFA initialization failed: ${error.message}`, 'HIGH');
        res.status(500).json({ message: "Failed to initialize MFA", error: error.message });
    }
};

/**
 * Verify MFA setup and enable MFA
 */
const verifyMFASetup = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ message: "MFA token is required" });
        }

        const user = await User.findById(req.user.id);
        if (!user || !user.mfaSecret) {
            await logSecurityEvent('MFA_VERIFY_SETUP', req.user, req, 'MFA verification without initialization', 'MEDIUM');
            return res.status(400).json({ message: "MFA not initialized. Please start setup first." });
        }

        // Decrypt secret and verify token
        const secret = decryptSecret(user.mfaSecret);
        const isValid = verifyMFAToken(token, secret);

        if (!isValid) {
            await logSecurityEvent('MFA_VERIFY_SETUP', req.user, req, 'Invalid MFA token during setup', 'MEDIUM');
            return res.status(400).json({ message: "Invalid MFA token" });
        }

        // Generate backup codes
        const backupCodes = generateBackupCodes();
        const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

        // Enable MFA and save backup codes
        user.mfaEnabled = true;
        user.mfaSetupCompleted = true;
        user.mfaBackupCodes = hashedBackupCodes;
        user.lastMfaVerification = new Date();
        await user.save();

        await logDataModification('MFA_ENABLE', req.user, req, 'USER', user._id.toString(), {
            action: 'MFA setup completed and enabled'
        });

        res.json({
            message: "MFA setup completed successfully",
            backupCodes: backupCodes, // Show backup codes only once
            mfaEnabled: true
        });

    } catch (error) {
        await logSecurityEvent('MFA_VERIFY_SETUP', req.user, req, `MFA setup verification failed: ${error.message}`, 'HIGH');
        res.status(500).json({ message: "Failed to verify MFA setup", error: error.message });
    }
};

/**
 * Verify MFA token during login
 */
const verifyMFA = async (req, res) => {
    try {
        const { token, backupCode } = req.body;
        const { userId } = req.params;

        if (!token && !backupCode) {
            return res.status(400).json({ message: "MFA token or backup code is required" });
        }

        const user = await User.findById(userId);
        if (!user || !user.mfaEnabled || !user.mfaSetupCompleted) {
            await logSecurityEvent('MFA_VERIFY', null, req, `MFA verification for user without MFA: ${userId}`, 'HIGH');
            return res.status(400).json({ message: "MFA not enabled for this user" });
        }

        let isValid = false;
        let usedBackupCode = false;

        if (backupCode) {
            // Verify backup code
            isValid = verifyBackupCode(backupCode, user.mfaBackupCodes);
            if (isValid) {
                // Remove used backup code
                user.mfaBackupCodes = removeBackupCode(backupCode, user.mfaBackupCodes);
                usedBackupCode = true;
            }
        } else if (token) {
            // Verify TOTP token
            const secret = decryptSecret(user.mfaSecret);
            isValid = verifyMFAToken(token, secret);
        }

        if (!isValid) {
            await logSecurityEvent('MFA_FAILED', { _id: userId, email: user.email }, req, 
                `Failed MFA verification - ${backupCode ? 'backup code' : 'TOTP token'}`, 'HIGH');
            return res.status(400).json({ message: "Invalid MFA token or backup code" });
        }

        // Update last verification time
        user.lastMfaVerification = new Date();
        await user.save();

        await logDataAccess('MFA_VERIFY', { _id: userId, email: user.email }, req, 'USER', userId, {
            method: usedBackupCode ? 'backup_code' : 'totp_token',
            remainingBackupCodes: user.mfaBackupCodes.length
        });

        res.json({
            message: "MFA verification successful",
            verified: true,
            usedBackupCode: usedBackupCode,
            remainingBackupCodes: user.mfaBackupCodes.length
        });

    } catch (error) {
        await logSecurityEvent('MFA_VERIFY', null, req, `MFA verification error: ${error.message}`, 'CRITICAL');
        res.status(500).json({ message: "Failed to verify MFA", error: error.message });
    }
};

/**
 * Disable MFA for user
 */
const disableMFA = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: "Password is required to disable MFA" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify password
        const bcrypt = require("bcryptjs");
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            await logSecurityEvent('MFA_DISABLE', req.user, req, 'Invalid password during MFA disable attempt', 'HIGH');
            return res.status(400).json({ message: "Invalid password" });
        }

        // Disable MFA
        user.mfaEnabled = false;
        user.mfaSecret = null;
        user.mfaBackupCodes = [];
        user.mfaSetupCompleted = false;
        user.lastMfaVerification = null;
        await user.save();

        await logDataModification('MFA_DISABLE', req.user, req, 'USER', user._id.toString(), {
            action: 'MFA disabled'
        });

        res.json({
            message: "MFA has been disabled successfully",
            mfaEnabled: false
        });

    } catch (error) {
        await logSecurityEvent('MFA_DISABLE', req.user, req, `MFA disable failed: ${error.message}`, 'HIGH');
        res.status(500).json({ message: "Failed to disable MFA", error: error.message });
    }
};

/**
 * Get MFA status for user
 */
const getMFAStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('mfaEnabled mfaSetupCompleted mfaBackupCodes');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await logDataAccess('MFA_STATUS', req.user, req, 'USER', user._id.toString());

        res.json({
            mfaEnabled: user.mfaEnabled,
            mfaSetupCompleted: user.mfaSetupCompleted,
            remainingBackupCodes: user.mfaBackupCodes ? user.mfaBackupCodes.length : 0
        });

    } catch (error) {
        await logSecurityEvent('MFA_STATUS', req.user, req, `MFA status check failed: ${error.message}`, 'MEDIUM');
        res.status(500).json({ message: "Failed to get MFA status", error: error.message });
    }
};

/**
 * Regenerate backup codes
 */
const regenerateBackupCodes = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: "Password is required to regenerate backup codes" });
        }

        const user = await User.findById(req.user.id);
        if (!user || !user.mfaEnabled) {
            return res.status(400).json({ message: "MFA is not enabled" });
        }

        // Verify password
        const bcrypt = require("bcryptjs");
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            await logSecurityEvent('MFA_BACKUP_REGEN', req.user, req, 'Invalid password during backup code regeneration', 'HIGH');
            return res.status(400).json({ message: "Invalid password" });
        }

        // Generate new backup codes
        const backupCodes = generateBackupCodes();
        const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

        user.mfaBackupCodes = hashedBackupCodes;
        await user.save();

        await logDataModification('MFA_BACKUP_REGEN', req.user, req, 'USER', user._id.toString(), {
            action: 'MFA backup codes regenerated'
        });

        res.json({
            message: "Backup codes regenerated successfully",
            backupCodes: backupCodes
        });

    } catch (error) {
        await logSecurityEvent('MFA_BACKUP_REGEN', req.user, req, `Backup code regeneration failed: ${error.message}`, 'HIGH');
        res.status(500).json({ message: "Failed to regenerate backup codes", error: error.message });
    }
};

module.exports = {
    initializeMFA,
    verifyMFASetup,
    verifyMFA,
    disableMFA,
    getMFAStatus,
    regenerateBackupCodes
};
