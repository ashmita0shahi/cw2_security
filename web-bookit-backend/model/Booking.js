const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
        checkIn: { type: Date, required: true },
        checkOut: { type: Date, required: true },
        confirmed: { type: Boolean, default: false },
        paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' }, // Track payment status
        transactionId: { type: String, default: null }, // Khalti Transaction ID
        amountPaid: { type: Number, required: false } // Store the amount paid
    },
    { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);