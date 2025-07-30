import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Unauthorized! Please login.");
                navigate("/login");
                return;
            }

            const response = await axios.get("http://localhost:3000/api/users/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUser(response.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to load profile.");
            setLoading(false);
        }
    };

    // Handle profile image update
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("image", file);

            try {
                const token = localStorage.getItem("token");
                const response = await axios.put(
                    "http://localhost:3000/api/users/update-profile-pic",
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                setUser(response.data);
                toast.success("Profile picture updated successfully!");
            } catch (error) {
                toast.error("Failed to update profile picture.");
            }
        }
    };

    if (loading) return <p className="text-center">Loading Profile...</p>;

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-bold text-center mb-4">Profile</h2>

                {/* Profile Picture */}
                <div className="flex flex-col items-center">
                    <label className="cursor-pointer">
                        <input type="file" className="hidden" onChange={handleImageChange} />
                        <img
                            src={user.image ? `http://localhost:3000${user.image}` : "/default-avatar.png"}
                            onError={(e) => (e.target.src = "/default-avatar.png")} // Fallback if image fails to load
                            alt="Profile"
                            className="w-24 h-24 rounded-full border-2 border-gray-300 object-cover"
                        />
                    </label>
                    <p className="text-sm text-gray-500 mt-2">Click to change picture</p>
                </div>

                {/* User Info */}
                <div className="mt-4 space-y-2">
                    <p><strong>Name:</strong> {user.fullname}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Phone:</strong> {user.phone}</p>
                    <p><strong>Address:</strong> {user.address}</p>
                </div>

                {/* Logout Button */}
                <button
                    onClick={() => {
                        localStorage.removeItem("token");
                        toast.success("Logged out successfully!");
                        navigate("/login");
                    }}
                    className="btn bg-emerald-600 btn-error mt-4 w-full"
                >
                    Logout
                </button>
            </div>
            <ToastContainer />
        </div>
    );
};

export default Profile;
