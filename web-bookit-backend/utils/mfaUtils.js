const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto-js');

// Encryption key for MFA secrets (should be in environment variables)
const ENCRYPTION_KEY = process.env.MFA_ENCRYPTION_KEY || 'your-secret-encryption-key-change-this';

/**
 * Encrypt MFA secret before storing in database
 */
const encryptSecret = (secret) => {
    return crypto.AES.encrypt(secret, ENCRYPTION_KEY).toString();
};

/**
 * Decrypt MFA secret when retrieving from database
 */
const decryptSecret = (encryptedSecret) => {
    const bytes = crypto.AES.decrypt(encryptedSecret, ENCRYPTION_KEY);
    return bytes.toString(crypto.enc.Utf8);
};

/**
 * Generate a new MFA secret for user
 */
const generateMFASecret = (userEmail, appName = 'BookIt App') => {
    const secret = speakeasy.generateSecret({
        name: userEmail,
        issuer: appName,
        length: 32
    });
    
    return {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url,
        manualEntryKey: secret.base32
    };
};

/**
 * Generate QR code for MFA setup
 */
const generateQRCode = async (otpauthUrl) => {
    try {
        const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
        return qrCodeDataURL;
    } catch (error) {
        throw new Error('Failed to generate QR code: ' + error.message);
    }
};

/**
 * Verify MFA token
 */
const verifyMFAToken = (token, secret) => {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps (60 seconds) of tolerance
    });
};

/**
 * Generate backup codes for MFA recovery
 */
const generateBackupCodes = (count = 10) => {
    const codes = [];
    for (let i = 0; i < count; i++) {
        // Generate 8-character alphanumeric code
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        codes.push(code);
    }
    return codes;
};

/**
 * Hash backup codes before storing
 */
const hashBackupCode = (code) => {
    return crypto.SHA256(code).toString();
};

/**
 * Verify backup code
 */
const verifyBackupCode = (code, hashedCodes) => {
    const hashedCode = hashBackupCode(code);
    return hashedCodes.includes(hashedCode);
};

/**
 * Remove used backup code
 */
const removeBackupCode = (code, hashedCodes) => {
    const hashedCode = hashBackupCode(code);
    return hashedCodes.filter(hc => hc !== hashedCode);
};

/**
 * Check if MFA token is required for user
 */
const isMFARequired = (user) => {
    return user.mfaEnabled && user.mfaSetupCompleted;
};

/**
 * Generate time-based one-time password for testing
 */
const generateTOTP = (secret) => {
    return speakeasy.totp({
        secret: secret,
        encoding: 'base32'
    });
};

module.exports = {
    encryptSecret,
    decryptSecret,
    generateMFASecret,
    generateQRCode,
    verifyMFAToken,
    generateBackupCodes,
    hashBackupCode,
    verifyBackupCode,
    removeBackupCode,
    isMFARequired,
    generateTOTP
};
