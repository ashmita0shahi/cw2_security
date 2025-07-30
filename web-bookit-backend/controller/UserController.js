const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { sendVerificationEmail } = require("../utils/emailService"); // Ensure email utility is imported

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

        res.status(200).json({ message: "OTP sent to email. Please verify." });
    } catch (err) {
        console.error("❌ Error registering user:", err); // ✅ Print error if any
        res.status(500).json({ message: "Error registering user", error: err.message });
    }
};


const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.otp !== otp || new Date() > user.otpExpires) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Mark user as verified
        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.status(200).json({ message: "Email verified. You can now log in." });
    } catch (err) {
        res.status(500).json({ message: "Error verifying OTP", error: err.message });
    }
};


const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Generate new OTP
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();

        // Send new OTP email
        await sendVerificationEmail(email, otp);

        res.status(200).json({ message: "New OTP sent to email." });
    } catch (err) {
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
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        if (!user.isVerified) {
            return res.status(400).json({ message: "Please verify your email first." });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({
            message: "Login successful",
            token,
            role: user.role, // Send role in response
        });
    } catch (err) {
        res.status(500).json({ message: "Error logging in", error: err.message });
    }
};


// Get All Users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find(); // Staffs can see all users
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users", error: error.message });
    }
};

// Get User by ID
const getUserById = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) res.json(user);
    else res.status(404).json({
        message: "User not found"
    });
};

// Delete User
const deleteUser = async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (user) res.json({ message: "User deleted successfully" });
    else res.status(404).json({ message: "User not found" });
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch user profile", error: error.message });
    }
};

const updateProfilePic = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.image = req.file ? `/uploads/${req.file.filename}` : user.image;
        await user.save();

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Failed to update profile picture", error: error.message });
    }
};



module.exports = { registerUser, loginUser, getAllUsers, getUserById, deleteUser, verifyOTP, resendOTP, getUserProfile, updateProfilePic };
