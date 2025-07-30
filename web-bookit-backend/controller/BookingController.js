const Booking = require('../model/Booking');
const Room = require('../model/Room');
const User = require('../model/User');
const { 
    initiateKhaltiPayment, 
    verifyKhaltiPayment, 
    isPaymentSuccessful, 
    isPaymentFailed 
} = require('../utils/khaltiService');

// Step 1: Initiate Room Booking with Khalti Payment
const initiateRoomBooking = async (req, res) => {
    try {
        const { roomId, checkIn, checkOut } = req.body;
        const userId = req.user.id;

        // Validate room availability
        const room = await Room.findById(roomId);
        if (!room || !room.available) {
            return res.status(400).json({ 
                success: false,
                message: "Room not available" 
            });
        }

        // Get user details for payment
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Calculate booking amount
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const numberOfDays = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const totalAmount = room.price * numberOfDays;

        // Create booking with pending status
        const booking = new Booking({
            user: userId,
            room: roomId,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            paymentStatus: 'initiated',
            amountPaid: 0,
            totalAmount: totalAmount
        });

        await booking.save();

        // Prepare Khalti payment data
        const paymentData = {
            amount: totalAmount,
            purchase_order_id: booking._id.toString(),
            purchase_order_name: `Room Booking - ${room.name}`,
            customer_info: {
                name: user.fullname,
                email: user.email,
                phone: user.phone
            },
            return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking/payment-callback`,
            website_url: process.env.FRONTEND_URL || 'http://localhost:5173',
            product_details: [
                {
                    identity: room._id.toString(),
                    name: room.name,
                    total_price: Math.round(totalAmount * 100), // Convert to paisa
                    quantity: numberOfDays,
                    unit_price: Math.round(room.price * 100) // Convert to paisa
                }
            ]
        };

        // Initiate payment with Khalti
        const khaltiResponse = await initiateKhaltiPayment(paymentData);

        if (!khaltiResponse.success) {
            // Delete the booking if payment initiation fails
            await Booking.findByIdAndDelete(booking._id);
            return res.status(400).json({
                success: false,
                message: "Failed to initiate payment",
                error: khaltiResponse.error
            });
        }

        // Update booking with Khalti payment details
        booking.khaltiPidx = khaltiResponse.data.pidx;
        booking.khaltiPaymentUrl = khaltiResponse.data.payment_url;
        await booking.save();

        res.status(200).json({
            success: true,
            message: "Payment initiated successfully",
            data: {
                bookingId: booking._id,
                paymentUrl: khaltiResponse.data.payment_url,
                pidx: khaltiResponse.data.pidx,
                expiresAt: khaltiResponse.data.expires_at,
                totalAmount: totalAmount,
                room: room.name
            }
        });

    } catch (error) {
        console.error("Error initiating room booking:", error);
        res.status(500).json({ 
            success: false,
            message: "Failed to initiate booking", 
            error: error.message 
        });
    }
};

// Step 2: Handle Payment Callback from Khalti
const handlePaymentCallback = async (req, res) => {
    try {
        const { pidx, status, transaction_id, purchase_order_id } = req.query;

        if (!pidx || !purchase_order_id) {
            return res.status(400).json({
                success: false,
                message: "Missing required payment parameters"
            });
        }

        // Find the booking
        const booking = await Booking.findById(purchase_order_id).populate('room user');
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Verify payment with Khalti
        const verificationResponse = await verifyKhaltiPayment(pidx);
        
        if (!verificationResponse.success) {
            booking.paymentStatus = 'failed';
            await booking.save();
            
            return res.status(400).json({
                success: false,
                message: "Payment verification failed",
                error: verificationResponse.error
            });
        }

        const paymentData = verificationResponse.data;

        // Update booking based on payment status
        if (isPaymentSuccessful(paymentData.status)) {
            booking.paymentStatus = 'completed';
            booking.khaltiTransactionId = paymentData.transaction_id;
            booking.amountPaid = paymentData.total_amount / 100; // Convert from paisa to NPR
            booking.confirmed = true;
            
            // Mark room as unavailable for the booking period
            const room = await Room.findById(booking.room._id);
            if (room) {
                room.available = false; // You might want to implement date-specific availability
                await room.save();
            }
            
        } else if (isPaymentFailed(paymentData.status)) {
            booking.paymentStatus = 'failed';
        } else {
            booking.paymentStatus = 'pending';
        }

        await booking.save();

        res.status(200).json({
            success: true,
            message: `Payment ${paymentData.status.toLowerCase()}`,
            data: {
                bookingId: booking._id,
                paymentStatus: booking.paymentStatus,
                transactionId: booking.khaltiTransactionId,
                amountPaid: booking.amountPaid,
                room: booking.room.name
            }
        });

    } catch (error) {
        console.error("Error handling payment callback:", error);
        res.status(500).json({ 
            success: false,
            message: "Failed to process payment callback", 
            error: error.message 
        });
    }
};

// Step 3: Verify Payment Status (for frontend polling)
const verifyPaymentStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId).populate('room user');
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // If payment is still pending and we have a pidx, check with Khalti
        if (booking.paymentStatus === 'initiated' && booking.khaltiPidx) {
            const verificationResponse = await verifyKhaltiPayment(booking.khaltiPidx);
            
            if (verificationResponse.success) {
                const paymentData = verificationResponse.data;
                
                if (isPaymentSuccessful(paymentData.status)) {
                    booking.paymentStatus = 'completed';
                    booking.khaltiTransactionId = paymentData.transaction_id;
                    booking.amountPaid = paymentData.total_amount / 100;
                    booking.confirmed = true;
                    await booking.save();
                } else if (isPaymentFailed(paymentData.status)) {
                    booking.paymentStatus = 'failed';
                    await booking.save();
                }
            }
        }

        res.status(200).json({
            success: true,
            data: {
                bookingId: booking._id,
                paymentStatus: booking.paymentStatus,
                confirmed: booking.confirmed,
                transactionId: booking.khaltiTransactionId,
                amountPaid: booking.amountPaid,
                totalAmount: booking.totalAmount,
                room: booking.room.name,
                checkIn: booking.checkIn,
                checkOut: booking.checkOut
            }
        });

    } catch (error) {
        console.error("Error verifying payment status:", error);
        res.status(500).json({ 
            success: false,
            message: "Failed to verify payment status", 
            error: error.message 
        });
    }
};


// Confirm a Booking (Staff only) - Legacy function for manual confirmation
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

// Get User's Bookings (User only)
const getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id }).populate('room');
        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch bookings', 
            error: error.message 
        });
    }
};

// Get All Bookings (Staff only)
const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('user room');
        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch bookings', 
            error: error.message 
        });
    }
};

// Cancel Booking (User only)
const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Check if user owns this booking
        if (booking.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to cancel this booking"
            });
        }

        // Only allow cancellation if payment is not completed
        if (booking.paymentStatus === 'completed') {
            return res.status(400).json({
                success: false,
                message: "Cannot cancel a confirmed booking. Please contact support for refunds."
            });
        }

        // Delete the booking
        await Booking.findByIdAndDelete(bookingId);

        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully"
        });

    } catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({ 
            success: false,
            message: "Failed to cancel booking", 
            error: error.message 
        });
    }
};

module.exports = { 
    initiateRoomBooking,
    handlePaymentCallback,
    verifyPaymentStatus,
    confirmBooking, 
    getUserBookings, 
    getAllBookings,
    cancelBooking
};
