import React, { useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar";
import Analytics from "./analytics";
import Bookings from "./booking";
import Rooms from "./room";
import Users from "./user";
import ActivityLogs from "./activitylogs";

const AdminDashboard = () => {
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("theme") === "dark";
    });

    const navigate = useNavigate();

    useEffect(() => {
        const role = localStorage.getItem("role");
        if (role !== "admin" && role !== "staff") {
            navigate("/dashboard"); // Redirect non-admin users
        }
    }, [navigate]);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    return (
        <div className={`flex h-screen transition-all duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
            <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />

            <div className="flex-1 flex flex-col p-6 transition-all duration-300">
                {/* <AdminNavbar darkMode={darkMode} setDarkMode={setDarkMode} /> */}

                <div className={`p-5 mt-20 shadow-md rounded-lg transition-all duration-300 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
                    <Routes>
                        <Route path="/rooms" element={<Rooms />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/bookings" element={<Bookings />} />
                        <Route path="/activity-logs" element={<ActivityLogs />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
