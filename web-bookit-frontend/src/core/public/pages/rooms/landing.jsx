import { Bed, Coffee, ConciergeBell, MapPin, Users, Wifi } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
    return (
        <div className="bg-gray-50">
            {/* Hero Section */}
            <section className="relative w-full h-screen">
                <img
                    src="src/assets/dug-out-pool-hotel-poolside-1134176.jpg" // Replace with your hotel image
                    alt="Luxury Hotel"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white text-center">
                    <h1 className="text-5xl font-bold mb-4">Welcome to Diamond Hotel</h1>
                    <p className="text-lg max-w-2xl">
                        Experience the finest luxury stay with breathtaking views, top-notch services, and unforgettable hospitality.
                    </p>
                    <Link to="/rooms">
                        <button className="mt-6 bg-emerald-500 px-6 py-3 text-lg rounded-lg font-semibold hover:bg-emerald-600 transition-transform hover:scale-105">
                            Book Your Stay
                        </button>
                    </Link>
                </div>
            </section>

            {/* Services Section */}
            <section className="py-16 text-center">
                <h2 className="text-4xl font-bold mb-8">Our Exclusive Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {[
                        { icon: <Bed size={40} />, title: "Luxury Rooms" },
                        { icon: <Coffee size={40} />, title: "24/7 Room Service" },
                        { icon: <Wifi size={40} />, title: "Free High-Speed Wi-Fi" },
                        { icon: <ConciergeBell size={40} />, title: "Concierge Service" },
                        { icon: <MapPin size={40} />, title: "Prime Location" },
                        { icon: <Users size={40} />, title: "Family Friendly" },
                    ].map((service, index) => (
                        <div key={index} className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
                            <div className="text-teal-500">{service.icon}</div>
                            <h3 className="text-xl font-semibold mt-3">{service.title}</h3>
                        </div>
                    ))}
                </div>
            </section>

            {/* Rooms Section */}
            <section className="bg-gray-100 py-16 text-center">
                <h2 className="text-4xl font-bold mb-8">Explore Our Rooms</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {[1, 2, 3].map((room, index) => (
                        <div key={index} className="bg-white shadow-lg rounded-lg overflow-hidden">
                            <img
                                src={'src/assets/room1.png'}
                                alt="Hotel Room"
                                className="w-full h-60 object-cover"
                            />
                            <div className="p-4">
                                <h3 className="text-2xl font-bold">Luxury Suite</h3>
                                <p className="text-teal-600 text-lg font-semibold">$250 / Night</p>
                                <Link to="/room-dash">
                                    <button className="mt-4 w-full bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 transition">
                                        View Room
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-16 text-center">
                <h2 className="text-4xl font-bold mb-8">What Our Guests Say</h2>
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        {
                            name: "Sarah Johnson",
                            review: "Absolutely the best hotel experience! The staff was so kind and the rooms were breathtaking.",
                        },
                        {
                            name: "Michael Brown",
                            review: "A luxury getaway with stunning views and world-class service. Highly recommended!",
                        },
                    ].map((testimonial, index) => (
                        <div key={index} className="bg-white p-6 rounded-lg shadow-md text-left">
                            <p className="text-gray-600 italic">"{testimonial.review}"</p>
                            <h4 className="text-lg font-semibold mt-4">{testimonial.name}</h4>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-emerald-500 py-16 text-center text-white">
                <h2 className="text-3xl font-bold">Book Your Stay With Us Today</h2>
                <p className="text-lg mt-2">Enjoy an unforgettable experience at Diamond Hotel.</p>
                <Link to="/room-dash">
                    <button className="mt-6 bg-white text-teal-500 px-6 py-3 text-lg rounded-lg font-semibold hover:bg-gray-200 transition-transform hover:scale-105">
                        Book Now
                    </button>
                </Link>
            </section>
        </div>
    );
};

export default LandingPage;
