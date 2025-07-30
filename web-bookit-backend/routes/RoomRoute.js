const express = require("express");
const { protect, staff } = require("../middleware/authMiddleware");
const {
    createRoom,
    getAllRooms,
    getRoomById,
    updateRoomAvailability,
    deleteRoom,
} = require("../controller/RoomController");
const { uploadsingle } = require("../middleware/uploads");

const router = express.Router();

// Public Routes
router.get("/", getAllRooms); // Get all rooms
router.get("/:id", getRoomById); // Get room by ID

// Staff Routes
router.post("/", protect, staff, uploadsingle, createRoom); // Create a new room
router.put("/:id/status", protect, staff, updateRoomAvailability); // Update room availability
router.delete("/:id", protect, staff, deleteRoom); // Delete a room

module.exports = router;
