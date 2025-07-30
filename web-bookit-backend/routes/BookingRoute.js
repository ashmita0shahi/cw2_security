const express = require('express');
const { protect, staff } = require('../middleware/authMiddleware');
const {
    bookRoom,
    getUserBookings,
    getAllBookings,
    confirmBooking,
} = require('../controller/BookingController');

const router = express.Router();

// User Routes
router.post('/book', protect, bookRoom); // Book a room
router.get('/getbooking', protect, getUserBookings); // Get user's bookings

// Staff Routes
router.get('/all', protect, staff, getAllBookings); // Get all bookings
router.put('/confirm/:id', protect, staff, confirmBooking); // Confirm a booking
router.delete('/cancel/:id', protect, staff, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to cancel booking', error: error.message });
    }
});


module.exports = router;