import axios from "axios";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [newRoom, setNewRoom] = useState({ name: "", type: "", price: "", description: "", amenities: "", image: null });
    const [isAdding, setIsAdding] = useState(false);

    // Fetch rooms from backend
    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await axios.get("http://localhost:3000/api/rooms");
            setRooms(response.data);
        } catch (error) {
            toast.error("Error fetching rooms. Please try again.");
        }
    };

    // Handle Room Availability Update
    const handleUpdateAvailability = async (roomId, availability) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Unauthorized: Please log in again.");
                return;
            }

            await axios.put(
                `http://localhost:3000/api/rooms/${roomId}/status`,
                { available: !availability },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            fetchRooms();
            toast.success("Room availability updated successfully!");
        } catch (error) {
            toast.error("Failed to update room availability. Check your permissions.");
        }
    };

    // Handle Delete Room
    const handleDeleteRoom = async (roomId) => {
        if (!window.confirm("Are you sure you want to delete this room?")) return;

        try {
            await axios.delete(`http://localhost:3000/api/rooms/${roomId}`);
            fetchRooms();
            toast.success("Room deleted successfully!");
        } catch (error) {
            toast.error("Error deleting room. Please try again.");
        }
    };

    // Handle Form Inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewRoom((prev) => ({ ...prev, [name]: value }));
    };

    // Handle File Upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
            if (!allowedTypes.includes(file.type)) {
                toast.error("Invalid file type. Please upload a JPG, PNG, GIF, or WEBP image.");
                return;
            }
            setNewRoom((prev) => ({ ...prev, image: file }));
        }
    };

    // Handle Add Room
    const handleAddRoom = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Unauthorized: Please log in again.");
                return;
            }

            const formData = new FormData();
            formData.append("name", newRoom.name);
            formData.append("type", newRoom.type);
            formData.append("price", newRoom.price);
            formData.append("description", newRoom.description);
            formData.append("amenities", newRoom.amenities);
            formData.append("image", newRoom.image);

            await axios.post("http://localhost:3000/api/rooms", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`,
                },
            });

            setIsAdding(false);
            fetchRooms();
            toast.success("Room added successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add room.");
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <ToastContainer position="top-right" autoClose={3000} />
            <h2 className="text-3xl font-bold text-center mb-6">Manage Rooms</h2>

            {/* Add Room Button */}
            <button className="mb-4 bg-green-500 text-white px-4 py-2 rounded-md" onClick={() => setIsAdding(true)}>
                + Add Room
            </button>

            {/* Room Table */}
            <div className="overflow-x-auto">
                <table className="table-auto w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border px-4 py-2">Image</th>
                            <th className="border px-4 py-2">Name</th>
                            <th className="border px-4 py-2">Type</th>
                            <th className="border px-4 py-2">Price</th>
                            <th className="border px-4 py-2">Availability</th>
                            <th className="border px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.map((room) => (
                            <tr key={room._id} className="text-center">
                                <td className="border px-4 py-2">
                                    {room.images?.length > 0 ? (
                                        <img src={`http://localhost:3000/${room.images[0]}`} alt={room.name} className="w-20 h-20 object-cover rounded-md" />
                                    ) : (
                                        "No Image"
                                    )}
                                </td>
                                <td className="border px-4 py-2">{room.name}</td>
                                <td className="border px-4 py-2">{room.type}</td>
                                <td className="border px-4 py-2">${room.price}</td>
                                <td className="border px-4 py-2">
                                    <button
                                        className={`px-4 py-1 rounded-md ${room.available ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
                                        onClick={() => handleUpdateAvailability(room._id, room.available)}
                                    >
                                        {room.available ? "Available" : "Not Available"}
                                    </button>
                                </td>
                                <td className="border px-4 py-2 space-x-2">
                                    <button className="bg-red-500 text-white px-4 py-1 rounded-md" onClick={() => handleDeleteRoom(room._id)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Room Modal */}
            {isAdding && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-5 rounded shadow-lg w-96">
                        <h3 className="text-lg font-bold mb-4">Add New Room</h3>

                        <input type="text" name="name" placeholder="Room Name" className="input input-bordered w-full mb-2" onChange={handleInputChange} />
                        <input type="text" name="type" placeholder="Room Type (e.g., Single, Double)" className="input input-bordered w-full mb-2" onChange={handleInputChange} />
                        <input type="number" name="price" placeholder="Price" className="input input-bordered w-full mb-2" onChange={handleInputChange} />
                        <textarea name="description" placeholder="Description" className="input input-bordered w-full mb-2" onChange={handleInputChange} />
                        <input type="text" name="amenities" placeholder="Amenities (comma-separated)" className="input input-bordered w-full mb-2" onChange={handleInputChange} />
                        <input type="file" className="input input-bordered w-full mb-2" onChange={handleFileChange} />

                        <div className="flex justify-end space-x-2 mt-4">
                            <button className="bg-gray-400 text-white px-4 py-2 rounded-md" onClick={() => setIsAdding(false)}>Cancel</button>
                            <button className="bg-emerald-500 text-white px-4 py-2 rounded-md" onClick={handleAddRoom}>Add Room</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rooms;
