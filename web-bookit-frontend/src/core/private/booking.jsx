import axios from "axios";
import { CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    // Fetch all bookings (For Staff/Admin)
    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Unauthorized! Please log in.");
                return;
            }

            const response = await axios.get("http://localhost:3000/api/bookings/all", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setBookings(response.data.reverse()); // Show newest bookings at the top
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch bookings.");
        } finally {
            setLoading(false);
        }
    };

    // Confirm a Booking (Change status to "confirmed" and move it to the top)
    const handleConfirm = async (bookingId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Unauthorized! Please log in.");
                return;
            }

            const response = await axios.put(
                `http://localhost:3000/api/bookings/confirm/${bookingId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setBookings(prevBookings => {
                // Move confirmed booking to the top
                const updatedBookings = prevBookings.map(booking =>
                    booking._id === bookingId ? { ...booking, confirmed: true } : booking
                );
                return [updatedBookings.find(booking => booking._id === bookingId), ...updatedBookings.filter(booking => booking._id !== bookingId)];
            });

            toast.success("Booking confirmed successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to confirm booking.");
        }
    };

    // Cancel a Booking
    const handleCancel = async (bookingId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Unauthorized! Please log in.");
                return;
            }

            await axios.delete(`http://localhost:3000/api/bookings/cancel/${bookingId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setBookings(prevBookings => prevBookings.filter(booking => booking._id !== bookingId));
            toast.success("Booking canceled successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to cancel booking.");
        }
    };

    return (
        <div className="p-6 flex justify-center bg-gray-100 min-h-screen">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="w-full max-w-6xl bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-6 text-gray-800">Manage Bookings</h2>

                {loading ? (
                    <p className="text-center text-gray-600">Loading bookings...</p>
                ) : bookings.length === 0 ? (
                    <p className="text-center text-gray-500">No bookings available.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table-auto w-full border-collapse border border-gray-300 shadow-sm">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border px-4 py-2">Customer</th>
                                    <th className="border px-4 py-2">Room</th>
                                    <th className="border px-4 py-2">Check-In</th>
                                    <th className="border px-4 py-2">Check-Out</th>
                                    <th className="border px-4 py-2">Status</th>
                                    <th className="border px-4 py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((booking) => (
                                    <tr key={booking._id} className="border-b hover:bg-gray-100">
                                        <td className="border px-4 py-2">{booking.user?.fullname || "Unknown"}</td>
                                        <td className="border px-4 py-2">{booking.room?.name || "Unknown"}</td>
                                        <td className="border px-4 py-2">{new Date(booking.checkIn).toLocaleDateString()}</td>
                                        <td className="border px-4 py-2">{new Date(booking.checkOut).toLocaleDateString()}</td>
                                        <td className={`border px-4 py-2 font-bold ${booking.confirmed ? "text-green-600" : "text-yellow-600"}`}>
                                            {booking.confirmed ? "Confirmed" : "Pending"}
                                        </td>
                                        <td className="border px-4 py-2 space-x-2">
                                            {!booking.confirmed && (
                                                <button
                                                    className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition duration-200"
                                                    onClick={() => handleConfirm(booking._id)}
                                                >
                                                    <CheckCircle className="inline-block mr-1" size={16} /> Confirm
                                                </button>
                                            )}
                                            <button
                                                className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition duration-200"
                                                onClick={() => handleCancel(booking._id)}
                                            >
                                                <XCircle className="inline-block mr-1" size={16} /> Cancel
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bookings;
