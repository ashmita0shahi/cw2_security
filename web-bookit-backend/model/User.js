const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    image: { type: String, default: null }, // Optional, set to null if no image
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" }, // User roles (admin/user/staff)
    isVerified: { type: Boolean, default: false }, // Email verification status
    otp: { type: String, default: null }, // OTP for email verification
    otpExpires: { type: Date, default: null }, // OTP expiry time
    
    // MFA Fields
    mfaEnabled: { type: Boolean, default: false }, // Whether MFA is enabled
    mfaSecret: { type: String, default: null }, // TOTP secret key (encrypted)
    mfaBackupCodes: [{ type: String }], // Backup codes for MFA recovery
    mfaSetupCompleted: { type: Boolean, default: false }, // Whether MFA setup is completed
    lastMfaVerification: { type: Date, default: null }, // Last successful MFA verification
});

const User = mongoose.model("User", userSchema);
module.exports = User;