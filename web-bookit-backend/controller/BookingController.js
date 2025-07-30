const Booking = require('../model/Booking');
const Room = require('../model/Room');

// Confirm a Booking (Staff only)
const confirmBooking = async (req, res) => {
    try {
        console.log("🔄 Booking Confirmation Requested for ID:", req.params.id);

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            console.log("❌ Booking Not Found");
            return res.status(404).json({ message: "Booking not found" });
        }

        // Update booking status
        booking.confirmed = true;
        await booking.save();
        console.log("✅ Booking Confirmed:", booking);

        res.json({ message: "Booking confirmed successfully", booking });
    } catch (error) {
        console.error("❌ Error confirming booking:", error);
        res.status(500).json({ message: "Failed to confirm booking", error: error.message });
    }
};


const axios = require('axios');

const verifyPayment = async (pidx, transactionId) => {
    const khaltiSecretKey = process.env.KHALTI_SECRET_KEY; // Get from environment or config
    const url = `https://khalti.com/api/v2/payment/verify/`;

    try {
        const response = await axios.post(url, {
            pidx,
            transactionId,
        }, {
            headers: {
                'Authorization': `Key ${khaltiSecretKey}`,
            },
        });

        return response.data;
    } catch (error) {
        throw new Error('Payment verification failed');
    }
};

const bookRoom = async (req, res) => {
    const { roomId, checkIn, checkOut } = req.body;

    try {
        const room = await Room.findById(roomId);
        if (!room || !room.available) {
            return res.status(400).json({ message: "Room not available" });
        }

        // Create a booking without Khalti payment
        const booking = await Booking.create({
            user: req.user._id,
            room: roomId,
            checkIn,
            checkOut,
            paymentStatus: "pending", // Payment tracking removed
            amountPaid: room.price, // Amount stored for reference
        });

        res.status(200).json({
            message: "Booking created successfully",
            booking,
        });
    } catch (error) {
        console.error("Error during booking:", error);
        res.status(500).json({ message: "Failed to book room", error: error.message });
    }
};


// Get User's Bookings (User only)
const getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id }).populate('room');
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
    }
};

// Get All Bookings (Staff only)
const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('user room');
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
    }
};



module.exports = { bookRoom, getUserBookings, getAllBookings, confirmBooking };
