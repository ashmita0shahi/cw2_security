const express = require('express');
const { protect, staff } = require('../middleware/authMiddleware');
const {
    initiateRoomBooking,
    handlePaymentCallback,
    verifyPaymentStatus,
    getUserBookings,
    getAllBookings,
    confirmBooking,
    cancelBooking
} = require('../controller/BookingController');

const router = express.Router();

// Khalti Payment Routes
router.post('/initiate-booking', protect, initiateRoomBooking); // Initiate room booking with Khalti
router.get('/payment-callback', handlePaymentCallback); // Handle Khalti payment callback (public route)
router.get('/verify-payment/:bookingId', protect, verifyPaymentStatus); // Verify payment status

// User Routes
router.get('/my-bookings', protect, getUserBookings); // Get user's bookings
router.delete('/cancel/:bookingId', protect, cancelBooking); // Cancel user's booking

// Staff Routes
router.get('/all', protect, staff, getAllBookings); // Get all bookings
router.put('/confirm/:id', protect, staff, confirmBooking); // Manual confirm a booking (legacy)

module.exports = router;