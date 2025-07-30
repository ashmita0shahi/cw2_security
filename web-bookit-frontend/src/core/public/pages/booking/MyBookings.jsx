import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CreditCard, MapPin, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/bookings/my-bookings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setBookings(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch bookings');
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/bookings/cancel/${bookingId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                toast.success('Booking cancelled successfully');
                fetchBookings(); // Refresh the list
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel booking');
        }
    };

    const getStatusBadge = (paymentStatus, confirmed) => {
        if (paymentStatus === 'completed' && confirmed) {
            return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Confirmed</span>;
        } else if (paymentStatus === 'completed') {
            return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Paid</span>;
        } else if (paymentStatus === 'pending' || paymentStatus === 'initiated') {
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>;
        } else if (paymentStatus === 'failed') {
            return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Failed</span>;
        }
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{paymentStatus}</span>;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <ToastContainer position="top-right" autoClose={3000} />
            
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">My Bookings</h1>
                    <button
                        onClick={() => navigate('/rooms')}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                    >
                        Book New Room
                    </button>
                </div>

                {bookings.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No bookings found</h3>
                        <p className="text-gray-500 mb-6">You haven't made any room bookings yet.</p>
                        <button
                            onClick={() => navigate('/rooms')}
                            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                        >
                            Browse Rooms
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.map((booking) => (
                            <div key={booking._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="md:flex">
                                    <div className="md:w-1/3">
                                        <img
                                            src={booking.room?.image ? `${import.meta.env.VITE_API_URL}${booking.room.image}` : '/default-room.jpg'}
                                            alt={booking.room?.name}
                                            className="w-full h-48 md:h-full object-cover"
                                        />
                                    </div>
                                    <div className="md:w-2/3 p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-800 mb-1">
                                                    {booking.room?.name}
                                                </h3>
                                                <p className="text-gray-600">{booking.room?.type}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(booking.paymentStatus, booking.confirmed)}
                                                {booking.paymentStatus === 'pending' && (
                                                    <button
                                                        onClick={() => handleCancelBooking(booking._id)}
                                                        className="p-1 text-red-500 hover:text-red-700"
                                                        title="Cancel booking"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                <span>Check-in: {formatDate(booking.checkIn)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                <span>Check-out: {formatDate(booking.checkOut)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <CreditCard className="w-4 h-4" />
                                                <span>Total: NPR {booking.totalAmount}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Clock className="w-4 h-4" />
                                                <span>Booked: {formatDate(booking.createdAt)}</span>
                                            </div>
                                        </div>

                                        {booking.khaltiTransactionId && (
                                            <div className="text-sm text-gray-500">
                                                Transaction ID: {booking.khaltiTransactionId}
                                            </div>
                                        )}

                                        {booking.paymentStatus === 'completed' && booking.confirmed && (
                                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <div className="flex items-center gap-2 text-green-700">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="font-medium">Booking Confirmed</span>
                                                </div>
                                                <p className="text-green-600 text-sm mt-1">
                                                    Your room is reserved. Please arrive on your check-in date.
                                                </p>
                                            </div>
                                        )}

                                        {booking.paymentStatus === 'failed' && (
                                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <div className="flex items-center gap-2 text-red-700">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    <span className="font-medium">Payment Failed</span>
                                                </div>
                                                <p className="text-red-600 text-sm mt-1">
                                                    This booking could not be processed. Please try booking again.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyBookings;
