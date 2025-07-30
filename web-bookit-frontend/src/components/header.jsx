import axios from "axios";
import { CalendarCheck, LogOut, Menu, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Header = ({ darkMode }) => {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Function to fetch user details
  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await axios.get("http://localhost:3000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data)); // Store user in local storage
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
        localStorage.removeItem("user");
      }
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetchUser();

    // ✅ Listen for storage changes to update user state after login
    window.addEventListener("storage", () => {
      const updatedUser = localStorage.getItem("user");
      setUser(updatedUser ? JSON.parse(updatedUser) : null);
    });

    return () => {
      window.removeEventListener("storage", () => { });
    };
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <header className={`fixed top-0 left-0 w-full z-50 shadow-md ${darkMode ? "bg-gray-900" : "bg-white"}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div>
            <Link to="/" className={`text-2xl font-bold ${darkMode ? "text-teal-600" : "text-teal-600"}`}>
              Bookit
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link to="/" className={`hover:text-green-500 ${darkMode ? "text-gray-300" : "text-gray-800"}`}>
              Home
            </Link>
            <Link to="/room-dash" className={`hover:text-green-500 ${darkMode ? "text-gray-300" : "text-gray-800"}`}>
              Rooms
            </Link>
            <Link to="/about" className={`hover:text-green-500 ${darkMode ? "text-gray-300" : "text-gray-800"}`}>
              About Us
            </Link>
            <Link to="/contact" className={`hover:text-green-500 ${darkMode ? "text-gray-300" : "text-gray-800"}`}>
              Contact Us
            </Link>
          </nav>

          {/* User Profile Section or Login Button */}
          <div className="relative">
            {user ? (
              <button onClick={() => setMenuOpen(!menuOpen)} className="relative w-10 h-10 rounded-full overflow-hidden border">
                <img
                  src={user.image ? `http://localhost:3000${user.image}` : "/default-avatar.png"}
                  alt="User Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => (e.target.src = "/default-avatar.png")} // Fallback Image
                />
              </button>
            ) : (
              <Link
                to="/login"
                className={`px-4 py-2 rounded-md ${darkMode ? "bg-green-500 text-white" : "bg-emerald-500 text-white"} hover:opacity-80`}
                onClick={() => window.dispatchEvent(new Event("storage"))} // Ensure update after login
              >
                Login
              </Link>
            )}

            {/* Dropdown Menu */}
            {menuOpen && user && (
              <div className={`absolute right-0 mt-2 w-44 shadow-lg rounded-lg ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
                <button
                  className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => navigate("/profile")}
                >
                  <User className="w-5 h-5 mr-2" /> View Profile
                </button>
                <button
                  className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => navigate("/bookings")}
                >
                  <CalendarCheck className="w-5 h-5 mr-2" /> My Bookings
                </button>
                <button
                  className="flex items-center w-full px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-2" /> Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              className={`focus:outline-none ${darkMode ? "text-gray-300" : "text-gray-800"}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden py-2 shadow-md ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>
            <Link to="/" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              Home
            </Link>
            <Link to="/rooms" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              Rooms
            </Link>
            <Link to="/about" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              About Us
            </Link>
            <Link to="/contact" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              Contact Us
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
