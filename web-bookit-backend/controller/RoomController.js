const Room = require("../model/Room");

// Create Room Handler with image upload
const createRoom = async (req, res) => {
  try {
    console.log("📩 Request Body:", req.body); // ✅ Print request body
    console.log("📷 Uploaded File:", req.file); // ✅ Print uploaded image file (if any)

    const { name, type, price, description, amenities } = req.body;

    if (!name || !type || !price || !description || !amenities) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Convert amenities string to an array
    const amenitiesArray = amenities.split(",");

    // Handle single image upload (Fix potential file upload issue)
    let imagePath = req.file ? req.file.path : null;
    console.log("🖼 Image Path:", imagePath); // ✅ Print Image Path

    // Create the room in the database
    const room = await Room.create({
      name,
      type,
      price,
      description,
      amenities: amenitiesArray,
      images: imagePath ? [imagePath] : [], // Store as an array
    });

    res.status(201).json(room);
  } catch (error) {
    console.error("❌ Error adding room:", error); // ✅ Print error if any
    res.status(500).json({ message: "Error adding room", error: error.message });
  }
};



// Other Handlers remain the same (getAllRooms, getRoomById, updateRoomAvailability, deleteRoom)


// Get All Rooms
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rooms", error: error.message });
  }
};

// Get Room by ID
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch room", error: error.message });
  }
};

// Update Room Availability (Staff only)
const updateRoomAvailability = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    room.available = req.body.available;
    await room.save();
    res.json({ message: "Room availability updated", room });
  } catch (error) {
    res.status(500).json({ message: "Failed to update room availability", error: error.message });
  }
};

// Delete Room
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete room", error: error.message });
  }
};

module.exports = { createRoom, getAllRooms, getRoomById, updateRoomAvailability, deleteRoom };
