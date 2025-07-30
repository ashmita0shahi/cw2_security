import { useNavigate } from "react-router-dom";

const AdminNavbar = ({ darkMode }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/login");
    };

    return (
        <div className={`fixed top-0 left-64 right-0 shadow-md p-4 flex justify-between ${darkMode ? "bg-gray-700 text-white" : "bg-white text-black"}`}>
            <h2 className="text-xl font-bold">Admin Dashboard</h2>
            <button onClick={handleLogout} className="p-2 bg-red-500 text-white rounded">
                Logout
            </button>
        </div>
    );
};

export default AdminNavbar;
