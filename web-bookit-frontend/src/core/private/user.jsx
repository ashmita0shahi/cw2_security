import axios from "axios";
import { Edit, Trash2, Users as UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [editData, setEditData] = useState({ fullname: "", address: "", phone: "" });
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    // Fetch Users
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Unauthorized! Please log in.");
                return;
            }

            const response = await axios.get("http://localhost:3000/api/users/all", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUsers(response.data.reverse()); // Show newest users at the top
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to fetch users.");
        }
    };

    // Handle Edit Button Click
    const handleEdit = (user) => {
        setEditingUser(user);
        setEditData({ fullname: user.fullname, address: user.address, phone: user.phone });
    };

    // Handle Input Changes
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData((prevData) => ({ ...prevData, [name]: value }));
    };

    // Save Edited User
    const handleSaveEdit = async () => {
        setShowConfirmModal(false);
        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:3000/api/users/${editingUser._id}`, editData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUsers(prevUsers => {
                const updatedUsers = prevUsers.map(user =>
                    user._id === editingUser._id ? { ...user, ...editData } : user
                );
                return [updatedUsers.find(user => user._id === editingUser._id), ...updatedUsers.filter(user => user._id !== editingUser._id)];
            });

            setEditingUser(null);
            toast.success("User updated successfully!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update user.");
        }
    };

    // Delete User
    const handleDelete = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:3000/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
            toast.success("User deleted successfully!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete user.");
        }
    };

    return (
        <div className="p-6 flex justify-center bg-gray-100 min-h-screen">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="w-full max-w-6xl bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center">
                    <UsersIcon className="mr-2" /> Manage Users
                </h2>

                {users.length === 0 ? (
                    <p className="text-center text-gray-500">No users found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table-auto w-full border-collapse border border-gray-300 shadow-sm">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border px-4 py-2">Full Name</th>
                                    <th className="border px-4 py-2">Address</th>
                                    <th className="border px-4 py-2">Phone</th>
                                    <th className="border px-4 py-2">Email</th>
                                    <th className="border px-4 py-2">Role</th>
                                    <th className="border px-4 py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id} className="border-b hover:bg-gray-100">
                                        <td className="border px-4 py-2">{user.fullname}</td>
                                        <td className="border px-4 py-2">{user.address}</td>
                                        <td className="border px-4 py-2">{user.phone}</td>
                                        <td className="border px-4 py-2">{user.email}</td>
                                        <td className="border px-4 py-2 capitalize">{user.role}</td>
                                        <td className="border px-4 py-2 space-x-2">
                                            <button
                                                className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 transition duration-200"
                                                onClick={() => handleEdit(user)}
                                            >
                                                <Edit className="inline-block mr-1" size={16} /> Edit
                                            </button>
                                            <button
                                                className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition duration-200"
                                                onClick={() => handleDelete(user._id)}
                                            >
                                                <Trash2 className="inline-block mr-1" size={16} /> Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Edit User</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                name="fullname"
                                placeholder="Full Name"
                                value={editData.fullname}
                                onChange={handleEditChange}
                                className="border border-gray-300 px-3 py-2 w-full rounded-md"
                            />
                            <input
                                type="text"
                                name="address"
                                placeholder="Address"
                                value={editData.address}
                                onChange={handleEditChange}
                                className="border border-gray-300 px-3 py-2 w-full rounded-md"
                            />
                            <input
                                type="text"
                                name="phone"
                                placeholder="Phone"
                                value={editData.phone}
                                onChange={handleEditChange}
                                className="border border-gray-300 px-3 py-2 w-full rounded-md"
                            />
                        </div>
                        <div className="flex justify-end mt-4 space-x-2">
                            <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md" onClick={() => setEditingUser(null)}>Cancel</button>
                            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600" onClick={() => setShowConfirmModal(true)}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
