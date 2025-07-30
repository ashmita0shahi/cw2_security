const express = require("express");
const { protect, staff } = require("../middleware/authMiddleware");
const { uploadsingle } = require("../middleware/uploads"); // Import the upload middleware

const {
    registerUser,
    loginUser,
    getAllUsers,
    getUserById,
    deleteUser,
    verifyOTP,
    resendOTP,
    getUserProfile,
    updateProfilePic
} = require("../controller/UserController");

const router = express.Router();

// General user actions
router.post("/register", uploadsingle, registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.get("/profile", protect, getUserProfile);
router.put("/update-profile-pic", protect, uploadsingle, updateProfilePic); // Update profile pic


// staff-only actions (e.g., get all users, delete users)
router.get("/all", protect, staff, getAllUsers);
router.get("/:id", protect, getUserById);
router.delete("/:id", protect, staff, deleteUser);

module.exports = router;