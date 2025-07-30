import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RoomDashboard = () => {
    const [rooms, setRooms] = useState([]);
    const [bookingDetails, setBookingDetails] = useState({ roomId: null, checkIn: "", checkOut: "" });
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRooms();
    }, []);

    // Fetch Rooms
    const fetchRooms = async () => {
        try {
            const response = await axios.get("http://localhost:3000/api/rooms");
            setRooms(response.data);
        } catch (error) {
            toast.error("Error fetching rooms. Please try again.");
        }
    };

    // Open Booking Modal
    const openBookingModal = (roomId) => {
        const token = localStorage.getItem("token");

        if (!token) {
            toast.error("Please login first!");
            navigate("/login");
            return;
        }

        setBookingDetails({ roomId, checkIn: "", checkOut: "" });
        setShowModal(true);
    };

    // Handle Booking
    const handleBooking = async () => {
        if (!bookingDetails.checkIn || !bookingDetails.checkOut) {
            toast.error("Please select check-in and check-out dates.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Unauthorized! Please log in.");
                navigate("/login");
                return;
            }

            await axios.post(
                "http://localhost:3000/api/bookings/book",
                {
                    roomId: bookingDetails.roomId,
                    checkIn: bookingDetails.checkIn,
                    checkOut: bookingDetails.checkOut,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            toast.success("Room booked successfully!");
            setShowModal(false);
            fetchRooms(); // Refresh room availability
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to book room. Please try again.");
        }
    };

    return (
        <div className="container bg-white mx-auto px-4 py-8">
            <ToastContainer position="top-right" autoClose={3000} />
            <h2 className="text-3xl font-bold text-center mb-6">Available Rooms</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                    <div key={room._id} className="bg-white shadow-md rounded-lg overflow-hidden">
                        {/* Room Image */}
                        {room.images && room.images.length > 0 ? (
                            <img
                                src={`http://localhost:3000/${room.images[0]}`}
                                alt={room.name}
                                className="w-full h-48 object-cover"
                            />
                        ) : (
                            <div className="w-full h-48 bg-gray-300 flex items-center justify-center text-gray-500">
                                No Image
                            </div>
                        )}

                        {/* Room Details */}
                        <div className="p-4">
                            <h3 className="text-xl font-bold">{room.name}</h3>
                            <p className="text-gray-600 capitalize">{room.type}</p>
                            <p className="text-green-600 font-semibold text-lg">${room.price} / night</p>

                            {/* Room Availability */}
                            <p className={`mt-2 font-bold ${room.available ? "text-green-500" : "text-red-500"}`}>
                                {room.available ? "Available" : "Not Available"}
                            </p>

                            {/* Book Now Button */}
                            <button
                                disabled={!room.available}
                                onClick={() => openBookingModal(room._id)}
                                className={`mt-4 w-full py-2 rounded-lg ${room.available ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-gray-400 text-gray-700"
                                    }`}
                            >
                                {room.available ? "Book Now" : "Unavailable"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Booking Confirmation Modal */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                            Confirm Your Booking
                        </h3>
                        <div className="space-y-4">
                            <label className="block font-semibold">Check-In Date:</label>
                            <input
                                type="date"
                                className="border rounded px-2 py-1 w-full"
                                value={bookingDetails.checkIn}
                                onChange={(e) => setBookingDetails({ ...bookingDetails, checkIn: e.target.value })}
                            />
                            <label className="block font-semibold mt-2">Check-Out Date:</label>
                            <input
                                type="date"
                                className="border rounded px-2 py-1 w-full"
                                value={bookingDetails.checkOut}
                                onChange={(e) => setBookingDetails({ ...bookingDetails, checkOut: e.target.value })}
                            />
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button className="btn bg-gray-500 text-white hover:bg-gray-600 mr-2" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button className="btn bg-emerald-500 text-white hover:bg-emerald-600" onClick={handleBooking}>
                                Confirm Booking
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomDashboard;
