import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./khalti-styles.css";
import Header from "./components/header";
import ProtectedRoute from "./components/protectedroute";
import AdminDashboard from "./core/private/admin";
import Login from "./core/public/pages/auth/login";
import Profile from "./core/public/pages/auth/profile";
import Register from "./core/public/pages/auth/register";
import MyBookings from "./core/public/pages/booking/booking";
import UserBookings from "./core/public/pages/booking/MyBookings";
import PaymentCallback from "./core/public/pages/booking/PaymentCallback";
import ContactPage from "./core/public/pages/booking/contactpage";
import LandingPage from "./core/public/pages/rooms/landing";
import RoomDashboard from "./core/public/pages/rooms/roomdash";
import AboutUs from "./core/public/pages/rooms/aboutus";
function App() {
  return (
    <Router>
      <ToastContainer position="bottom-right" autoClose={1500} />
      <div className="bg-white min-h-screen"> {/* ✅ Ensures background is always white */}
        <Header />
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/room-dash" element={<RoomDashboard />} />
          <Route path="/rooms" element={<RoomDashboard />} />
          <Route path="/admin/*" element={<ProtectedRoute allowedRoles={["admin", "staff"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/my-bookings" element={<UserBookings />} />
          <Route path="/payment-callback" element={<PaymentCallback />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutUs />} />



        </Routes>
      </div>
    </Router>
  );
}

export default App;
