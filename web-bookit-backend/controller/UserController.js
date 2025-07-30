const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { sendVerificationEmail } = require("../utils/emailService"); // Ensure email utility is imported
const { 
    logUserAuthentication, 
    logDataAccess, 
    logDataModification,
    logSecurityEvent 
} = require("../middleware/activityLogger");
const mime = require("mime-types");

require("dotenv").config();

// Generate OTP function
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();



const registerUser = async (req, res) => {
    console.log("📩 Request Body:", req.body); // ✅ Print request body
    console.log("📷 Uploaded File:", req.file); // ✅ Print uploaded image file (if any)
    try {
        const { fullname, address, phone, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            await logSecurityEvent('REGISTER', null, req, `Registration attempt with existing email: ${email}`, 'MEDIUM');
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP and set expiry time (5 mins)
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

        // Handle image upload (optional)
        let imagePath = req.file ? `/uploads/${req.file.filename}` : null;
        console.log("🖼 Image Path:", imagePath); // ✅ Print Image Path

        // Validate uploaded image file type (if any)
        if (req.file) {
            const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
            const mimeType = mime.lookup(req.file.originalname);
            if (!allowedTypes.includes(mimeType)) {
                return res.status(400).json({
                    message: "Invalid file type. Only JPG, JPEG, and PNG are allowed."
                });
            }
        }

        // Create new user
        user = new User({
            fullname,
            address,
            phone,
            email,
            password: hashedPassword,
            otp,
            otpExpires,
            isVerified: false,
            image: imagePath,
        });

        await user.save();

        // Send OTP email
        await sendVerificationEmail(email, otp);

        // Log successful registration
        await logUserAuthentication('REGISTER', user, req, true);

        res.status(200).json({ message: "OTP sent to email. Please verify." });
    } catch (err) {
        console.error("❌ Error registering user:", err); // ✅ Print error if any
        await logSecurityEvent('REGISTER', null, req, `Registration failed: ${err.message}`, 'HIGH');
        res.status(500).json({ message: "Error registering user", error: err.message });
    }
};


const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.otp !== otp || new Date() > user.otpExpires) {
            await logSecurityEvent('VERIFY_EMAIL', user, req, `Failed OTP verification for email: ${email}`, 'MEDIUM');
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Mark user as verified
        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        // Log successful email verification
        await logUserAuthentication('VERIFY_EMAIL', user, req, true);

        res.status(200).json({ message: "Email verified. You can now log in." });
    } catch (err) {
        await logSecurityEvent('VERIFY_EMAIL', null, req, `OTP verification error: ${err.message}`, 'HIGH');
        res.status(500).json({ message: "Error verifying OTP", error: err.message });
    }
};


const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            await logSecurityEvent('RESEND_OTP', null, req, `OTP resend attempt for non-existent email: ${email}`, 'MEDIUM');
            return res.status(400).json({ message: "User not found" });
        }

        // Generate new OTP
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();

        // Send new OTP email
        await sendVerificationEmail(email, otp);

        // Log OTP resend
        await logUserAuthentication('RESEND_OTP', user, req, true);

        res.status(200).json({ message: "New OTP sent to email." });
    } catch (err) {
        await logSecurityEvent('RESEND_OTP', null, req, `OTP resend failed: ${err.message}`, 'HIGH');
        res.status(500).json({ message: "Error resending OTP", error: err.message });
    }
};

// Login User
// const loginUser = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         const user = await User.findOne({ email });
//         if (!user || !await bcrypt.compare(password, user.password)) {
//             return res.status(400).json({ message: "Invalid email or password" });
//         }

//         if (!user.isVerified) {
//             return res.status(400).json({ message: "Please verify your email first." });
//         }

//         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

//         res.status(200).json({ message: "Login successful", token });
//     } catch (err) {
//         res.status(500).json({ message: "Error logging in", error: err.message });
//     }
// };

const loginUser = async (req, res) => {
    try {
        const { email, password, mfaToken, mfaBackupCode } = req.body;

        const user = await User.findOne({ email });
        // If user not found, return error (no increment)
        if (!user) {
            await logUserAuthentication('FAILED_LOGIN', null, req, false, "Invalid email or password");
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Check if the user is locked out
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            return res.status(403).json({
                message: `Account is locked. Try again after ${user.lockoutUntil}`
            });
        }

        // Check password
        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            user.failedLoginAttempts += 1;
            // Lock account if 5 or more failed attempts
            if (user.failedLoginAttempts >= 5) {
                user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
                await user.save();
                await logUserAuthentication('FAILED_LOGIN', user, req, false, "Account locked due to multiple failed login attempts.");
                return res.status(403).json({
                    message: "Account locked due to multiple failed login attempts. Try again later."
                });
            }
            await user.save();
            await logUserAuthentication('FAILED_LOGIN', user, req, false, "Invalid email or password");
            return res.status(400).json({ message: "Invalid email or password" });
        }

        if (!user.isVerified) {
            await logSecurityEvent('LOGIN', user, req, `Login attempt with unverified email: ${email}`, 'MEDIUM');
            return res.status(400).json({ message: "Please verify your email first." });
        }

        // Check if the password has expired (90 days)
        const passwordExpiryDays = 90;
        const passwordExpiryDate = new Date(user.passwordLastUpdated);
        passwordExpiryDate.setDate(passwordExpiryDate.getDate() + passwordExpiryDays);

        if (new Date() > passwordExpiryDate) {
            return res.status(403).json({
                message: "Your password has expired. Please reset your password."
            });
        }

        // Reset failed login attempts and lockout on successful login
        user.failedLoginAttempts = 0;
        user.lockoutUntil = null;
        await user.save();

        // Check if MFA is enabled for this user
        if (user.mfaEnabled && user.mfaSetupCompleted) {
            // MFA is required
            if (!mfaToken && !mfaBackupCode) {
                await logSecurityEvent('LOGIN_MFA_REQUIRED', user, req, `Login requires MFA for user: ${email}`, 'LOW');
                return res.status(200).json({
                    message: "MFA verification required",
                    requiresMFA: true,
                    userId: user._id,
                    tempToken: null // Don't provide JWT until MFA is verified
                });
            }

            // Verify MFA token or backup code
            const { isMFARequired, verifyMFAToken, verifyBackupCode, removeBackupCode, decryptSecret } = require("../utils/mfaUtils");
            
            let mfaValid = false;
            let usedBackupCode = false;

            if (mfaBackupCode) {
                mfaValid = verifyBackupCode(mfaBackupCode, user.mfaBackupCodes);
                if (mfaValid) {
                    user.mfaBackupCodes = removeBackupCode(mfaBackupCode, user.mfaBackupCodes);
                    usedBackupCode = true;
                }
            } else if (mfaToken) {
                const secret = decryptSecret(user.mfaSecret);
                mfaValid = verifyMFAToken(mfaToken, secret);
            }

            if (!mfaValid) {
                await logUserAuthentication('FAILED_LOGIN', user, req, false, "Invalid MFA token");
                return res.status(400).json({ message: "Invalid MFA token or backup code" });
            }

            // Update last MFA verification
            user.lastMfaVerification = new Date();
            if (usedBackupCode) {
                await user.save();
            }
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Log successful login
        await logUserAuthentication('LOGIN', user, req, true);

        res.status(200).json({
            message: "Login successful",
            token,
            role: user.role,
            requiresMFA: false,
            mfaEnabled: user.mfaEnabled || false
        });
    } catch (err) {
        await logSecurityEvent('LOGIN', null, req, `Login error: ${err.message}`, 'HIGH');
        res.status(500).json({ message: "Error logging in", error: err.message });
    }
};


// Get All Users
const getAllUsers = async (req, res) => {
    try {
        await logDataAccess('VIEW_USERS', req.user, req, 'USER');
        const users = await User.find(); // Staffs can see all users
        res.json(users);
    } catch (error) {
        await logSecurityEvent('VIEW_USERS', req.user, req, `Failed to fetch users: ${error.message}`, 'MEDIUM');
        res.status(500).json({ message: "Failed to fetch users", error: error.message });
    }
};

// Get User by ID
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await logDataAccess('VIEW_USER', req.user, req, 'USER', req.params.id);
            res.json(user);
        } else {
            await logSecurityEvent('VIEW_USER', req.user, req, `Attempted to view non-existent user: ${req.params.id}`, 'LOW');
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        await logSecurityEvent('VIEW_USER', req.user, req, `Error fetching user: ${error.message}`, 'MEDIUM');
        res.status(500).json({ message: "Error fetching user", error: error.message });
    }
};

// Delete User
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (user) {
            await logDataModification('DELETE_USER', req.user, req, 'USER', req.params.id, {
                deletedUser: { email: user.email, fullname: user.fullname }
            });
            res.json({ message: "User deleted successfully" });
        } else {
            await logSecurityEvent('DELETE_USER', req.user, req, `Attempted to delete non-existent user: ${req.params.id}`, 'LOW');
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        await logSecurityEvent('DELETE_USER', req.user, req, `Error deleting user: ${error.message}`, 'HIGH');
        res.status(500).json({ message: "Error deleting user", error: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            await logSecurityEvent('VIEW_PROFILE', req.user, req, `Profile access for non-existent user: ${req.user.id}`, 'MEDIUM');
            return res.status(404).json({ message: "User not found" });
        }
        
        await logDataAccess('VIEW_PROFILE', req.user, req, 'USER', req.user.id);
        res.json(user);
    } catch (error) {
        await logSecurityEvent('VIEW_PROFILE', req.user, req, `Error fetching profile: ${error.message}`, 'MEDIUM');
        res.status(500).json({ message: "Failed to fetch user profile", error: error.message });
    }
};

const updateProfilePic = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            await logSecurityEvent('UPDATE_PROFILE_PICTURE', req.user, req, `Profile picture update for non-existent user: ${req.user.id}`, 'MEDIUM');
            return res.status(404).json({ message: "User not found" });
        }

        const oldImage = user.image;
        user.image = req.file ? `/uploads/${req.file.filename}` : user.image;
        await user.save();

        await logDataModification('UPDATE_PROFILE_PICTURE', req.user, req, 'USER', req.user.id, {
            oldImage,
            newImage: user.image,
            fileName: req.file ? req.file.filename : null
        });

        res.json(user);
    } catch (error) {
        await logSecurityEvent('UPDATE_PROFILE_PICTURE', req.user, req, `Error updating profile picture: ${error.message}`, 'HIGH');
        res.status(500).json({ message: "Failed to update profile picture", error: error.message });
    }
};



module.exports = { registerUser, loginUser, getAllUsers, getUserById, deleteUser, verifyOTP, resendOTP, getUserProfile, updateProfilePic };
