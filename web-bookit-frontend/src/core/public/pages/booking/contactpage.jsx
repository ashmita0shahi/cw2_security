import React, { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

const ContactPage = () => {
    const [captchaVerified, setCaptchaVerified] = useState(false);

    // Handle reCAPTCHA Verification
    const handleRecaptcha = (value) => {
        setCaptchaVerified(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!captchaVerified) {
            alert("Please verify the reCAPTCHA to submit the form.");
            return;
        }
        alert("Form submitted successfully!");
        // Perform form submission logic here (e.g., send data to backend)
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 px-4">
            <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-xl">
                <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Contact Us</h1>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Full Name and Email Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium  text-gray-700">Full Name</label>
                            <input type="text" placeholder="Full Name" className="input bg-white input-bordered w-full" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium  text-gray-700">Email Address</label>
                            <input type="email" placeholder="Email Address" className="input  bg-white input-bordered w-full" required />
                        </div>
                    </div>

                    {/* Phone Number and Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium   text-gray-700">Phone Number</label>
                            <input type="tel" placeholder="Phone Number" className="input bg-white input-bordered w-full" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium  text-gray-700">Location</label>
                            <input type="text" placeholder="Location" className="input bg-white input-bordered w-full" required />
                        </div>
                    </div>

                    {/* Expertise Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Interested In</label>
                        <select className="select select-bordered bg-white w-full" required defaultValue="">
                            <option value="" disabled>Select</option>
                            <option value="Room">Room</option>
                            <option value="Booking">Booking</option>
                        </select>
                    </div>

                    {/* Message Box */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tell Us About Your View</label>
                        <textarea placeholder="Leave your message here" className="textarea bg-white textarea-bordered w-full" rows="4" required></textarea>
                    </div>

                    {/* Google reCAPTCHA */}
                    <div className="flex justify-center">
                        <ReCAPTCHA
                            sitekey="6LesP98qAAAAANFQ-qffAjJeux17CIx8lXjOVsLJ" // Replace with your actual reCAPTCHA site key
                            onChange={handleRecaptcha}
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-center">
                        <button
                            type="submit"
                            className={`px-6 py-2 rounded-full font-semibold text-white transition-transform hover:scale-105 ${captchaVerified ? "bg-emerald-500 hover:bg-emerald-600" : "bg-gray-400 cursor-not-allowed"
                                }`}
                            disabled={!captchaVerified}
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContactPage;
