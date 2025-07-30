const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ["single", "double", "suite"] }, // Example: Single, Double, Suite
    price: { type: Number, required: true },
    description: { type: String, required: true },
    amenities: { type: [String], required: true }, // Example: Wi-Fi, TV, Air Conditioning
    available: { type: Boolean, default: true }, // True if the room is available for booking
    images: { type: [String] }, // Array of image URLs for the room
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
