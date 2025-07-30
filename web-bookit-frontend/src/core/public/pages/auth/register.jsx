import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PasswordStrengthMeter from "../../../../components/PasswordStrengthMeter.jsx";
import { sanitizeInput, sanitizeFormData, createSanitizedHandler } from "../../../../utils/sanitize.js";

const Register = () => {
    const { register, handleSubmit, reset } = useForm();
    const [otpSent, setOtpSent] = useState(false);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [profileImage, setProfileImage] = useState(null);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const navigate = useNavigate();

    // Handle Image Upload
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
            if (!allowedTypes.includes(file.type)) {
                toast.error("Invalid file type. Please upload a PNG, JPEG, or JPG image.");
                return;
            }
            setProfileImage(URL.createObjectURL(file));
        }
    };

    // Handle Registration
    const onSubmit = async (data) => {
        try {
            // Sanitize form data before sending
            const sanitizedData = sanitizeFormData(data, ['image']); // Exclude image from sanitization
            
            const formData = new FormData();
            formData.append("fullname", sanitizedData.fullname);
            formData.append("address", sanitizedData.address);
            formData.append("phone", sanitizedData.phone);
            formData.append("email", sanitizedData.email);
            formData.append("password", sanitizedData.password);
            if (data.image[0]) {
                formData.append("image", data.image[0]);
            }

            const response = await axios.post(
                "http://localhost:3000/api/users/register",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            toast.success(response.data.message || "OTP sent! Check your email.");
            setOtpSent(true);
            setEmail(data.email);
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed. Please try again.");
        }
    };

    // Handle OTP Verification
    const handleOtpVerification = async () => {
        if (!otp.trim()) {
            toast.error("Please enter the OTP.");
            return;
        }

        try {
            const response = await axios.post("http://localhost:3000/api/users/verify-otp", {
                email,
                otp,
            });

            toast.success(response.data.message || "OTP verified successfully!");
            reset();
            setOtpSent(false);
            navigate("/login");
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid OTP. Please try again.");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
                {!otpSent ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <h2 className="text-3xl font-bold text-center text-gray-700 mb-4">Register</h2>

                        {/* Profile Picture Selection */}
                        <div className="flex justify-center">
                            <label htmlFor="imageUpload" className="cursor-pointer">
                                <img
                                    src={profileImage || "/default-avatar.png"}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full border-4 border-gray-300 object-cover"
                                />
                            </label>
                            <input
                                type="file"
                                id="imageUpload"
                                className="hidden"
                                accept="image/*"
                                {...register("image")}
                                onChange={handleImageChange}
                            />
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-gray-900 font-medium mb-1">Full Name</label>
                            <input
                                type="text"
                                placeholder="Enter your full name"
                                className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                                {...register("fullname", { required: true })}
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-gray-600 font-medium mb-1">Address</label>
                            <input
                                type="text"
                                placeholder="Enter your address"
                                className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                                {...register("address", { required: true })}
                            />
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-gray-600 font-medium mb-1">Phone Number</label>
                            <input
                                type="tel"
                                placeholder="Enter your phone number"
                                className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                                {...register("phone", { required: true })}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-gray-600 font-medium mb-1">Email</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                                {...register("email", { required: true })}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-gray-600 font-medium mb-1">Password</label>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                                {...register("password", { required: true })}
                                value={password}
                                onChange={e => {
                                    const sanitizedValue = sanitizeInput(e.target.value);
                                    setPassword(sanitizedValue);
                                    setPasswordError("");
                                }}
                            />
                            <PasswordStrengthMeter password={password} />
                            {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
                        </div>

                        {/* Register Button */}
                        <button
                            type="submit"
                            className="w-full py-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition duration-200 shadow-md font-semibold"
                            onClick={e => {
                                // Password requirements
                                const reqs = [
                                    password.length >= 10,
                                    /[A-Z]/.test(password),
                                    /[a-z]/.test(password),
                                    /[0-9]/.test(password),
                                    /[^A-Za-z0-9]/.test(password)
                                ];
                                if (!reqs.every(Boolean)) {
                                    e.preventDefault();
                                    setPasswordError("Password must be at least 10 characters and include uppercase, lowercase, number, and special character.");
                                }
                            }}
                        >
                            Register
                        </button>

                        {/* Already Registered? */}
                        <p className="text-center text-gray-600 mt-3">
                            Already have an account?{" "}
                            <Link to="/login" className="text-blue-500 font-semibold hover:underline">
                                Login here
                            </Link>
                        </p>
                    </form>
                ) : (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4 text-gray-700">Verify OTP</h2>
                        <input
                            type="text"
                            placeholder="Enter OTP"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                            value={otp}
                            onChange={(e) => setOtp(sanitizeInput(e.target.value))}
                        />
                        <button
                            className="mt-4 w-full py-2 text-white bg-green-500 hover:bg-green-600 rounded-lg transition duration-200 shadow-md font-semibold"
                            onClick={handleOtpVerification}
                        >
                            Verify OTP
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Register;
