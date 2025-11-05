import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      <div className="text-center p-10 max-w-2xl">
        <h1 className="text-5xl font-extrabold text-blue-700 mb-4">
          ⚡ CloudCharge
        </h1>
        <p className="text-gray-700 text-lg mb-8">
          Power up your journey — Find, book, and manage EV charging stations
          near you effortlessly.
        </p>
        <div className="space-x-4">
          <Link
            to="/login"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 bg-white text-blue-600 border border-blue-600 font-semibold rounded-xl shadow-md hover:bg-blue-50 transition"
          >
            Register
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-4 text-gray-500 text-sm">
        © 2025 CloudCharge · All rights reserved
      </footer>
    </div>
  );
}
