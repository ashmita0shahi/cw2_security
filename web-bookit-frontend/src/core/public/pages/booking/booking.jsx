import axios from "axios";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    toast.error("Unauthorized! Please login.");
                    return;
                }

                const response = await axios.get("http://localhost:3000/api/bookings/getbooking", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setBookings(response.data);
            } catch (err) {
                toast.error("Failed to fetch bookings. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    return (
        <div className="container mx-auto px-4 py-8">
            <ToastContainer position="top-right" autoClose={3000} />
            <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">My Bookings</h2>

            {loading ? (
                <p className="text-center text-gray-600">Loading...</p>
            ) : bookings.length === 0 ? (
                <p className="text-center text-gray-600">You have no bookings yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {bookings.map((booking) => (
                        <div key={booking._id} className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900">{booking.room?.name}</h3>
                            <p className="text-gray-600 mt-1">
                                <span className="font-semibold">Check-in:</span> {new Date(booking.checkIn).toLocaleDateString()}
                            </p>
                            <p className="text-gray-600">
                                <span className="font-semibold">Check-out:</span> {new Date(booking.checkOut).toLocaleDateString()}
                            </p>
                            <p className="mt-3">
                                <span className="font-semibold">Status: </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${booking.confirmed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                    {booking.confirmed ? "Confirmed" : "Pending"}
                                </span>
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyBookings;
