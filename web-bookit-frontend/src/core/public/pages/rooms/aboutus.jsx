import { Award, Building, MapPin, ShieldCheck, Users } from "lucide-react";
import React from "react";

const AboutUs = () => {
    return (
        <div className="bg-gray-50">
            {/* Hero Section */}
            <section className="relative w-full h-[500px] flex items-center justify-center text-center">
                <img
                    src="src/assets/lobby.jpeg"
                    alt="About Us Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
                <div className="relative text-white">
                    <h1 className="text-5xl font-bold">About Diamond Hotel</h1>
                    <p className="mt-2 text-lg max-w-2xl">
                        A luxurious experience crafted with world-class hospitality.
                    </p>
                </div>
            </section>

            {/* Introduction Section */}
            <section className="py-16 text-center px-6">
                <h2 className="text-4xl font-bold text-teal-600">Who We Are</h2>
                <p className="mt-4 max-w-4xl mx-auto text-lg text-gray-700">
                    Diamond Hotel is a prestigious hospitality destination offering unparalleled luxury, comfort, and service.
                    With a commitment to excellence, we ensure our guests experience the best of hospitality.
                </p>
            </section>

            {/* Why Choose Us Section */}
            <section className="bg-white py-16 text-center">
                <h2 className="text-4xl font-bold text-teal-600 mb-8">Why Choose Us?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {[
                        { icon: <Building size={40} />, title: "Premium Luxury", description: "Stay in beautifully designed luxury rooms with breathtaking views." },
                        { icon: <ShieldCheck size={40} />, title: "Top Security", description: "We prioritize your safety with 24/7 security and surveillance." },
                        { icon: <Users size={40} />, title: "Customer Satisfaction", description: "Over 95% of our guests recommend us for our world-class service." },
                        { icon: <MapPin size={40} />, title: "Prime Location", description: "Located in the heart of the city with easy access to tourist spots." },
                        { icon: <Award size={40} />, title: "Award-Winning", description: "Recognized globally for our excellence in hospitality and service." },
                    ].map((feature, index) => (
                        <div key={index} className="bg-gray-100 p-6 rounded-lg shadow-md flex flex-col items-center">
                            <div className="text-teal-500">{feature.icon}</div>
                            <h3 className="text-xl font-semibold mt-3">{feature.title}</h3>
                            <p className="text-gray-600 mt-2">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Our Story Section */}
            <section className="py-16 bg-gray-50 text-center px-6">
                <h2 className="text-4xl font-bold text-teal-600">Our Story</h2>
                <p className="mt-4 max-w-4xl mx-auto text-lg text-gray-700">
                    Established in 1998, Diamond Hotel has been a beacon of excellence in the hospitality industry. From humble beginnings, we have grown into one of the most sought-after luxury destinations, providing an unmatched experience to travelers worldwide.
                </p>
            </section>

            {/* Call-to-Action Section */}
            <section className="bg-emerald-500 py-16 text-center text-white">
                <h2 className="text-3xl font-bold">Experience Luxury Like Never Before</h2>
                <p className="text-lg mt-2">Book your stay at Diamond Hotel and indulge in elegance and comfort.</p>
                <button className="mt-6 bg-white text-teal-500 px-6 py-3 text-lg rounded-lg font-semibold hover:bg-gray-200 transition-transform hover:scale-105">
                    Book Now
                </button>
            </section>
        </div>
    );
};

export default AboutUs;
