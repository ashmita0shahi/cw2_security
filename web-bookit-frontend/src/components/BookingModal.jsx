import React, { useState } from 'react';
import { Calendar, CreditCard, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { sanitizeInput } from '../utils/sanitize';

const BookingModal = ({ room, isOpen, onClose, onBookingInitiate }) => {
    const [bookingData, setBookingData] = useState({
        checkIn: '',
        checkOut: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const sanitizedValue = sanitizeInput(value);
        setBookingData(prev => ({
            ...prev,
            [name]: sanitizedValue
        }));
        setError('');
    };

    const calculateTotalAmount = () => {
        if (!bookingData.checkIn || !bookingData.checkOut || !room) return 0;
        
        const checkIn = new Date(bookingData.checkIn);
        const checkOut = new Date(bookingData.checkOut);
        const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        return days > 0 ? days * room.price : 0;
    };

    const handleKhaltiPayment = async () => {
        if (!bookingData.checkIn || !bookingData.checkOut) {
            setError('Please select check-in and check-out dates');
            return;
        }

        const checkIn = new Date(bookingData.checkIn);
        const checkOut = new Date(bookingData.checkOut);
        
        if (checkIn >= checkOut) {
            setError('Check-out date must be after check-in date');
            return;
        }

        if (checkIn < new Date()) {
            setError('Check-in date cannot be in the past');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const totalAmount = calculateTotalAmount();
            
            // Khalti Sandbox Configuration
            const khaltiConfig = {
                publicKey: import.meta.env.VITE_KHALTI_PUBLIC_KEY,
                productIdentity: room._id,
                productName: `Room Booking - ${room.name}`,
                productUrl: window.location.origin,
                paymentPreference: [
                    "KHALTI",
                    "EBANKING", 
                    "MOBILE_BANKING",
                    "CONNECT_IPS",
                    "SCT",
                ],
                eventHandler: {
                    onSuccess(payload) {
                        console.log("Khalti Payment Success:", payload);
                        // Call the parent component's booking handler
                        onBookingInitiate({
                            ...bookingData,
                            roomId: room._id,
                            totalAmount: totalAmount,
                            khaltiToken: payload.token,
                            khaltiAmount: payload.amount
                        });
                    },
                    onError(error) {
                        console.error("Khalti Payment Error:", error);
                        setError("Payment failed. Please try again.");
                        setLoading(false);
                    },
                    onClose() {
                        console.log("Khalti Payment Closed");
                        setLoading(false);
                    }
                }
            };

            // Import and initialize Khalti
            const { default: KhaltiCheckout } = await import('khalti-checkout-web');
            const checkout = new KhaltiCheckout(khaltiConfig);
            
            // Show Khalti checkout with amount in paisa (multiply by 100)
            checkout.show({ amount: totalAmount * 100 });
            
        } catch (err) {
            console.error("Error initializing Khalti:", err);
            setError('Failed to initialize payment. Please try again.');
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const totalAmount = calculateTotalAmount();
    const numberOfDays = bookingData.checkIn && bookingData.checkOut 
        ? Math.ceil((new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24))
        : 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Book Room</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {room && (
                    <div className="mb-4">
                        <img
                            src={room.image ? `${import.meta.env.VITE_API_URL}${room.image}` : '/default-room.jpg'}
                            alt={room.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                        <h3 className="font-semibold text-lg">{room.name}</h3>
                        <p className="text-gray-600">{room.type}</p>
                        <p className="text-emerald-600 font-bold">NPR {room.price}/night</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Check-in Date
                        </label>
                        <input
                            type="date"
                            name="checkIn"
                            value={bookingData.checkIn}
                            onChange={handleInputChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Check-out Date
                        </label>
                        <input
                            type="date"
                            name="checkOut"
                            value={bookingData.checkOut}
                            onChange={handleInputChange}
                            min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none"
                        />
                    </div>

                    {numberOfDays > 0 && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">{numberOfDays} night{numberOfDays > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Rate per night:</span>
                                <span className="font-medium">NPR {room?.price}</span>
                            </div>
                            <hr className="my-2" />
                            <div className="flex justify-between items-center font-bold">
                                <span>Total Amount:</span>
                                <span className="text-emerald-600">NPR {totalAmount}</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleKhaltiPayment}
                        disabled={loading || !bookingData.checkIn || !bookingData.checkOut}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Opening Khalti...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-4 h-4" />
                                Pay with Khalti (NPR {totalAmount})
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
