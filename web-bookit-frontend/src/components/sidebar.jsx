import { Menu, X } from "lucide-react"; // Icons for toggle button
import { useState } from "react";
import { Link } from "react-router-dom";

const Sidebar = ({ darkMode, setDarkMode }) => {
    const [isOpen, setIsOpen] = useState(true); // Sidebar open/close state

    return (
        <>
            {/* Toggle Button (Always Visible) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 p-2 bg-emerald-500 text-white rounded-full shadow-md"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar (Slides In/Out) */}
            <div
                className={`fixed top-0 left-0 h-full w-64 shadow-lg p-5 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    } ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}
            >
                <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
                <ul>
                    <li className="mb-4">
                        <Link to="/admin/rooms" className="block p-2 rounded hover:bg-gray-300">Rooms</Link>
                    </li>
                    <li className="mb-4">
                        <Link to="/admin/users" className="block p-2 rounded hover:bg-gray-300">Users</Link>
                    </li>
                    <li className="mb-4">
                        <Link to="/admin/analytics" className="block p-2 rounded hover:bg-gray-300">Analytics</Link>
                    </li>
                    <li className="mb-4">
                        <Link to="/admin/bookings" className="block p-2 rounded hover:bg-gray-300">Bookings</Link>
                    </li>
                    <li className="mb-4">
                        <Link to="/admin/activity-logs" className="block p-2 rounded hover:bg-gray-300">Activity Logs</Link>
                    </li>
                </ul>
                <button onClick={() => setDarkMode(!darkMode)} className="mt-4 p-2 bg-emerald-500 text-white w-full rounded">
                    {darkMode ? "Light Mode" : "Dark Mode"}
                </button>
            </div>
        </>
    );
};

export default Sidebar;
