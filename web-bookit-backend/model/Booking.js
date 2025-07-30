const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
        checkIn: { type: Date, required: true },
        checkOut: { type: Date, required: true },
        confirmed: { type: Boolean, default: false },
        paymentStatus: { type: String, enum: ['pending', 'completed', 'failed', 'initiated'], default: 'pending' },
        
        // Khalti Payment Fields
        khaltiPidx: { type: String, default: null }, // Khalti payment identifier
        khaltiTransactionId: { type: String, default: null }, // Khalti transaction ID
        khaltiPaymentUrl: { type: String, default: null }, // Khalti payment URL for user redirection
        
        // Payment Details
        amountPaid: { type: Number, required: true },
        totalAmount: { type: Number, required: true },
        
        // Legacy field for backward compatibility
        transactionId: { type: String, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);