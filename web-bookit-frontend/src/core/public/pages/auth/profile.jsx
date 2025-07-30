import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import MFASettings from "../../../../components/MFASettings.jsx";
import "react-toastify/dist/ReactToastify.css";

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'security'
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

            const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/profile`, {
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
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/update-profile-pic`,
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
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                        <p className="text-gray-600">Manage your profile and security settings</p>
                    </div>
                    
                    {/* Tabs */}
                    <div className="px-6">
                        <nav className="flex space-x-8">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'profile'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Profile
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'security'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Security
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'profile' ? (
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
                            
                            {/* Profile Picture */}
                            <div className="flex flex-col items-center mb-6">
                                <label className="cursor-pointer">
                                    <input type="file" className="hidden" onChange={handleImageChange} />
                                    <img
                                        src={user.image ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.image}` : "/default-avatar.png"}
                                        onError={(e) => (e.target.src = "/default-avatar.png")}
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full border-2 border-gray-300 object-cover hover:border-blue-500 transition-colors"
                                    />
                                </label>
                                <p className="text-sm text-gray-500 mt-2">Click to change picture</p>
                            </div>

                            {/* User Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.fullname}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.phone}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Address</label>
                                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.address}</p>
                                </div>
                            </div>

                            {/* Logout Button */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        localStorage.removeItem("token");
                                        localStorage.removeItem("role");
                                        toast.success("Logged out successfully!");
                                        navigate("/login");
                                    }}
                                    className="w-full md:w-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <MFASettings />
                )}
            </div>
            <ToastContainer />
        </div>
    );
};

export default Profile;
