import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";


const Login = () => {
    const { register, handleSubmit } = useForm();
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // Handle Login
    const onSubmit = async (data) => {
        try {
            const response = await axios.post("http://localhost:3000/api/users/login", data);
            toast.success("Login Successful!");

            // Save token & user role in localStorage
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("role", response.data.role); // Store role

            // Set theme preference
            const theme = localStorage.getItem("theme") || "light"; // Default to light if not set
            document.documentElement.classList.toggle("dark", theme === "dark");

            // Redirect based on role
            if (response.data.role === "admin" || response.data.role === "staff") {
                navigate("/admin");
            } else {
                navigate("/room-dash");
            }

        } catch (error) {
            setError(error.response?.data?.message || "Login failed");
        }
    };

    return (

        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
                <h2 className="text-3xl font-bold text-center text-gray-700 mb-6">Welcome Back</h2>

                {/* Error Message */}
                {error && <p className="text-red-500 text-center mb-3">{error}</p>}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Email Input */}
                    <div>
                        <label className="block text-gray-600  font-medium mb-1">Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="w-full px-4 py-2 border bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                            {...register("email", { required: true })}
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-gray-600 font-medium mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            className="w-full px-4 py-2 border bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                            {...register("password", { required: true })}
                        />
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        className="w-full py-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition duration-200 shadow-md font-semibold"
                    >
                        Login
                    </button>
                </form>

                {/* Register Navigation */}
                <p className="text-center text-gray-600 mt-4">
                    Haven't registered yet?{" "}
                    <Link to="/register" className="text-blue-500 font-semibold hover:underline">
                        Sign up here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
