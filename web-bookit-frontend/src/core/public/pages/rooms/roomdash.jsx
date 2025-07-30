import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Wifi, Car, Coffee, MapPin, Users, Bed } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import BookingModal from '../../../../components/BookingModal';
import { sanitizeInput, sanitizeHTML } from '../../../../utils/sanitize';

const RoomDashboard = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/rooms`);
            // Handle both response formats: direct array or wrapped in success/data structure
            if (response.data.success) {
                setRooms(response.data.data);
            } else if (Array.isArray(response.data)) {
                setRooms(response.data);
            } else {
                setRooms([]);
            }
        } catch (error) {
            toast.error('Failed to fetch rooms');
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        const sanitizedValue = sanitizeInput(e.target.value);
        setSearchTerm(sanitizedValue);
    };

    const handleFilterChange = (e) => {
        const sanitizedValue = sanitizeInput(e.target.value);
        setFilterType(sanitizedValue);
    };

    const handleBookNow = (room) => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Please login to book a room');
            navigate('/login');
            return;
        }
        setSelectedRoom(room);
        setShowBookingModal(true);
    };

    const handleBookingSuccess = () => {
        setShowBookingModal(false);
        setSelectedRoom(null);
        toast.success('Booking initiated successfully!');
    };

    const handleBookingInitiate = async (bookingData) => {
        try {
            console.log('Processing booking with Khalti payment:', bookingData);
            
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please login to continue');
            }

            // Create booking with Khalti payment details
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/bookings/create`,
                {
                    roomId: bookingData.roomId,
                    checkIn: bookingData.checkIn,
                    checkOut: bookingData.checkOut,
                    totalAmount: bookingData.totalAmount,
                    paymentMethod: 'khalti',
                    khaltiToken: bookingData.khaltiToken,
                    khaltiAmount: bookingData.khaltiAmount
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setShowBookingModal(false);
                setSelectedRoom(null);
                toast.success('Booking confirmed successfully!');
                
                // Redirect to bookings page after 2 seconds
                setTimeout(() => {
                    navigate('/my-bookings');
                }, 2000);
            } else {
                throw new Error(response.data.message || 'Failed to create booking');
            }
            
        } catch (error) {
            console.error('Booking creation error:', error);
            toast.error(error.response?.data?.message || error.message || 'Failed to create booking');
        }
    };

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            room.type?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || room.type === filterType;
        return matchesSearch && matchesFilter;
    });

    const getRoomTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'single':
                return <Bed className="w-4 h-4" />;
            case 'double':
                return <Users className="w-4 h-4" />;
            case 'suite':
                return <Star className="w-4 h-4" />;
            default:
                return <Bed className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 pt-20">
            <ToastContainer position="top-right" autoClose={3000} />
            
            {/* Header Section */}
            <div className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Available Rooms</h1>
                    
                    {/* Search and Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search rooms by name or type..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="md:w-48">
                            <select
                                value={filterType}
                                onChange={handleFilterChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="all">All Types</option>
                                <option value="single">Single</option>
                                <option value="double">Double</option>
                                <option value="suite">Suite</option>
                                <option value="deluxe">Deluxe</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rooms Grid */}
            <div className="container mx-auto px-4 py-8">
                {filteredRooms.length === 0 ? (
                    <div className="text-center py-12">
                        <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No rooms found</h3>
                        <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRooms.map((room) => (
                            <div key={room._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                {/* Room Image */}
                                <div className="relative h-48">
                                    <img
                                        src={room.image ? `${import.meta.env.VITE_API_URL}${room.image}` : '/default-room.jpg'}
                                        alt={room.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-4 right-4">
                                        <span className="bg-emerald-500 text-white px-2 py-1 rounded-full text-sm font-medium">
                                            {room.available ? 'Available' : 'Booked'}
                                        </span>
                                    </div>
                                </div>

                                {/* Room Details */}
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-semibold text-gray-800">
                                            {sanitizeHTML(room.name)}
                                        </h3>
                                        <div className="flex items-center gap-1 text-emerald-600">
                                            {getRoomTypeIcon(room.type)}
                                            <span className="text-sm font-medium">{room.type}</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 mb-4 line-clamp-2">
                                        {sanitizeHTML(room.description)}
                                    </p>

                                    {/* Amenities */}
                                    <div className="flex items-center gap-4 mb-4 text-gray-500 text-sm">
                                        {room.amenities?.includes('wifi') && <Wifi className="w-4 h-4" />}
                                        {room.amenities?.includes('parking') && <Car className="w-4 h-4" />}
                                        {room.amenities?.includes('breakfast') && <Coffee className="w-4 h-4" />}
                                        <span className="text-xs">+{room.amenities?.length || 0} amenities</span>
                                    </div>

                                    {/* Price and Booking */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-2xl font-bold text-emerald-600">
                                                NPR {room.price}
                                            </span>
                                            <span className="text-gray-500 text-sm ml-1">/night</span>
                                        </div>
                                        <button
                                            onClick={() => handleBookNow(room)}
                                            disabled={!room.available}
                                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                                room.available
                                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            {room.available ? 'Book Now' : 'Not Available'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {showBookingModal && selectedRoom && (
                <BookingModal
                    room={selectedRoom}
                    isOpen={showBookingModal}
                    onClose={() => {
                        setShowBookingModal(false);
                        setSelectedRoom(null);
                    }}
                    onBookingInitiate={handleBookingInitiate}
                />
            )}
        </div>
    );
};

export default RoomDashboard;
