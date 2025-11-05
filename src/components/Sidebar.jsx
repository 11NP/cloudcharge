import React from "react";
import { useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="w-64 bg-blue-700 text-white h-screen fixed top-0 left-0 flex flex-col p-6">
      {/* Left-aligned title */}
      <h2 className="text-2xl font-bold mb-10 text-left pl-2">CloudCharge</h2>

      {/* Left-aligned nav buttons */}
      <nav className="flex flex-col space-y-3 text-left">
        <button
          onClick={() => navigate("/home")}
          className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left"
        >
          Home
        </button>
        <button
          onClick={() => navigate("/booking")}
          className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left"
        >
          Book Slot
        </button>
        <button
          onClick={() => navigate("/my-bookings")}
          className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left"
        >
          My Bookings
        </button>
        <button
          onClick={() => navigate("/swap")}
          className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left"
        >
          Swap Battery
        </button>
        <button
          onClick={() => navigate("/my-swaps")}
          className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left"
        >
          My Swaps
        </button>
        <button
          onClick={() => navigate("/profile")}
          className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left"
        >
          Profile
        </button>
      </nav>

      {/* Logout button at bottom */}
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 py-2 rounded-lg mt-4 font-semibold text-left px-4"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
  