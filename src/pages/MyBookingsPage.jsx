import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="w-64 bg-blue-700 text-white h-screen fixed top-0 left-0 flex flex-col p-6">
      <h2 className="text-2xl font-bold mb-10 text-center">CloudCharge</h2>
      <nav className="flex flex-col space-y-4 text-left">
        <button onClick={() => navigate("/home")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">
          Home
        </button>
        <button onClick={() => navigate("/booking")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">
          Book Slot
        </button>
        <button onClick={() => navigate("/my-bookings")} className="bg-blue-600 px-4 py-2 rounded-lg font-semibold transition text-left">
          My Bookings
        </button>
        <button onClick={() => navigate("/swap")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">
          Swap Battery
        </button>
        <button onClick={() => navigate("/my-swaps")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">
          My Swaps
        </button>
        <button onClick={() => navigate("/profile")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">
          Profile
        </button>
      </nav>

      <div className="mt-auto">
        <button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 py-2 rounded-lg mt-4 font-semibold">
          Logout
        </button>
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [message, setMessage] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  // 🔄 Fetch bookings
  const fetchBookings = async () => {
    if (!user?._id) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/bookings/user/${user._id}`);
      setBookings(res.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  // ❌ Cancel a booking and refresh list
  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/bookings/${bookingId}`);
      if (res.status === 200) {
        setMessage("Booking cancelled successfully.");
        await fetchBookings(); // 🔁 refresh to show it in history
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setMessage("Failed to cancel booking. Please try again.");
    }
  };

  const activeBookings = bookings.filter(
    (b) => b.status === "Confirmed" || b.status === "Charging"
  );
  const completedBookings = bookings.filter((b) => b.status === "Completed");
  const cancelledBookings = bookings.filter((b) => b.status === "Cancelled");

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      <Sidebar />
      <div className="flex-grow ml-64 p-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">My Bookings</h1>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition"
          >
            {showHistory ? "Hide History" : "Show History"}
          </button>
        </div>

        {message && (
          <p
            className={`text-center mb-4 ${
              message.includes("cancelled")
                ? "text-green-600"
                : message.includes("Failed")
                ? "text-red-600"
                : "text-gray-700"
            }`}
          >
            {message}
          </p>
        )}

        {/* 🔵 Active Bookings */}
        {!showHistory ? (
          activeBookings.length === 0 ? (
            <p className="text-gray-600 text-lg">No active bookings found.</p>
          ) : (
            <ul className="space-y-4">
              {activeBookings.map((b) => (
                <li
                  key={b._id}
                  className="p-5 bg-white shadow-md rounded-xl border border-gray-200 hover:shadow-lg transition"
                >
                  <h2 className="font-semibold text-lg text-gray-800">
                    {b.station?.name || b.stationName || "Unknown Station"}
                  </h2>
                  <p className="text-gray-600">
                    {new Date(b.startTime).toLocaleString()} →{" "}
                    {new Date(b.endTime).toLocaleString()}
                  </p>
                  <p
                    className={`text-sm mt-2 font-medium ${
                      b.status === "Charging"
                        ? "text-yellow-600"
                        : b.status === "Confirmed"
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    Status: {b.status}
                  </p>

                  <div className="flex justify-end mt-4 gap-3">
                    <button
                      onClick={() => navigate("/booking")}
                      className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Rebook
                    </button>
                    <button
                      onClick={() => handleCancel(b._id)}
                      className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
                    >
                      Cancel Booking
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-200 space-y-10">
            {/* ✅ Completed Bookings */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                Completed Bookings
              </h3>
              {completedBookings.length === 0 ? (
                <p className="text-gray-600 text-lg">No completed bookings yet.</p>
              ) : (
                <table className="min-w-full border border-gray-200 rounded-lg mb-8">
                  <thead className="bg-blue-100 text-gray-700">
                    <tr>
                      <th className="p-3 text-left">Station</th>
                      <th className="p-3 text-left">Start Time</th>
                      <th className="p-3 text-left">End Time</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedBookings.map((b) => (
                      <tr key={b._id} className="border-t hover:bg-gray-50 transition">
                        <td className="p-3">{b.station?.name || b.stationName || "—"}</td>
                        <td className="p-3">{new Date(b.startTime).toLocaleString()}</td>
                        <td className="p-3">{new Date(b.endTime).toLocaleString()}</td>
                        <td className="p-3 font-semibold text-green-600">{b.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {}
            <div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                
              </h3>
              {cancelledBookings.length === 0 ? (
                <p className="text-gray-600 text-lg">
                  
                </p>
              ) : (
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-red-100 text-gray-700">
                    <tr>
                      <th className="p-3 text-left">Station</th>
                      <th className="p-3 text-left">Start Time</th>
                      <th className="p-3 text-left">End Time</th>
                      <th className="p-3 text-left">Cancelled On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cancelledBookings.map((b) => (
                      <tr key={b._id} className="border-t hover:bg-gray-50 transition">
                        <td className="p-3">{b.station?.name || b.stationName || "—"}</td>
                        <td className="p-3">{new Date(b.startTime).toLocaleString()}</td>
                        <td className="p-3">{new Date(b.endTime).toLocaleString()}</td>
                        <td className="p-3 text-red-600 font-medium">
                          {new Date(b.updatedAt || b.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
