import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Loader } from 'lucide-react';

const PaymentCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [paymentStatus, setPaymentStatus] = useState('processing');
    const [paymentData, setPaymentData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const handlePaymentCallback = async () => {
            const pidx = searchParams.get('pidx');
            const status = searchParams.get('status');
            const transactionId = searchParams.get('transaction_id');
            const purchaseOrderId = searchParams.get('purchase_order_id');

            if (!pidx || !purchaseOrderId) {
                setPaymentStatus('error');
                setError('Missing payment parameters');
                return;
            }

            try {
                // Call backend to handle payment callback
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/bookings/payment-callback?pidx=${pidx}&status=${status}&transaction_id=${transactionId}&purchase_order_id=${purchaseOrderId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const data = await response.json();

                if (data.success) {
                    setPaymentData(data.data);
                    setPaymentStatus(data.data.paymentStatus);
                } else {
                    setPaymentStatus('failed');
                    setError(data.message || 'Payment processing failed');
                }
            } catch (err) {
                setPaymentStatus('failed');
                setError('Failed to process payment. Please contact support.');
                console.error('Payment callback error:', err);
            }
        };

        handlePaymentCallback();
    }, [searchParams]);

    const handleContinue = () => {
        if (paymentStatus === 'completed') {
            navigate('/my-bookings'); // Redirect to user's bookings
        } else {
            navigate('/rooms'); // Redirect back to rooms
        }
    };

    const renderContent = () => {
        switch (paymentStatus) {
            case 'processing':
                return (
                    <div className="text-center">
                        <Loader className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Payment</h2>
                        <p className="text-gray-600">Please wait while we verify your payment...</p>
                    </div>
                );

            case 'completed':
                return (
                    <div className="text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
                        <p className="text-gray-600 mb-4">Your room booking has been confirmed.</p>
                        {paymentData && (
                            <div className="bg-green-50 p-4 rounded-lg mb-4 text-left">
                                <h3 className="font-semibold mb-2">Booking Details:</h3>
                                <p><strong>Room:</strong> {paymentData.room}</p>
                                <p><strong>Transaction ID:</strong> {paymentData.transactionId}</p>
                                <p><strong>Amount Paid:</strong> NPR {paymentData.amountPaid}</p>
                                <p><strong>Booking ID:</strong> {paymentData.bookingId}</p>
                            </div>
                        )}
                        <button
                            onClick={handleContinue}
                            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                            View My Bookings
                        </button>
                    </div>
                );

            case 'failed':
                return (
                    <div className="text-center">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
                        <p className="text-gray-600 mb-4">{error || 'Your payment could not be processed.'}</p>
                        <button
                            onClick={handleContinue}
                            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                            Try Again
                        </button>
                    </div>
                );

            case 'pending':
                return (
                    <div className="text-center">
                        <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-yellow-600 mb-2">Payment Pending</h2>
                        <p className="text-gray-600 mb-4">Your payment is being processed. Please check back later.</p>
                        <button
                            onClick={handleContinue}
                            className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                        >
                            Continue
                        </button>
                    </div>
                );

            default:
                return (
                    <div className="text-center">
                        <XCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-600 mb-2">Unknown Status</h2>
                        <p className="text-gray-600 mb-4">Unable to determine payment status.</p>
                        <button
                            onClick={handleContinue}
                            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                            Go Back
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md mx-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default PaymentCallback;
