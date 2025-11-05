import React, { useEffect, useState } from "react";
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
        <button onClick={() => navigate("/home")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">Home</button>
        <button onClick={() => navigate("/booking")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">Book Slot</button>
        <button onClick={() => navigate("/my-bookings")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">My Bookings</button>
        <button onClick={() => navigate("/swap")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">Swap Battery</button>
        <button onClick={() => navigate("/my-swaps")} className="bg-blue-600 px-4 py-2 rounded-lg font-semibold transition text-left">My Swaps</button>
        <button onClick={() => navigate("/profile")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">Profile</button>
      </nav>
      <div className="mt-auto">
        <button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 py-2 rounded-lg mt-4 font-semibold">Logout</button>
      </div>
    </div>
  );
}

// Helper functions
const toRad = (deg) => (deg * Math.PI) / 180;
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};
const getStationLatLng = (s) => {
  const coords = s?.location?.coordinates;
  if (Array.isArray(coords) && coords.length >= 2)
    return { lat: Number(coords[1]), lng: Number(coords[0]) };
  return null;
};

export default function MySwapsPage() {
  const [swaps, setSwaps] = useState([]);
  const [activeSwap, setActiveSwap] = useState(null);
  const [stations, setStations] = useState([]);
  const [sortedStations, setSortedStations] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [isSorting, setIsSorting] = useState(true);
  const [message, setMessage] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  // Fetch swaps
  const fetchSwaps = async () => {
    if (!user?._id) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/swaps/user/${user._id}`);
      setSwaps(res.data);
      const active = res.data.find((s) => s.status === "Active");
      setActiveSwap(active || null);
    } catch (err) {
      console.error("Error fetching swaps:", err);
      setMessage("❌ Failed to load swaps. Please try again.");
    }
  };

  // Fetch stations
  const fetchStations = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/stations");
      setStations(res.data || []);
    } catch (err) {
      console.error("Error fetching stations:", err);
    }
  };

  // Deposit battery
  const handleDeposit = async (stationId) => {
    if (!activeSwap) return;
    setIsProcessing(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/swaps/${activeSwap._id}/deposit`,
        { destinationStation: stationId }
      );
      if (res.status === 200) {
        alert("✅ Battery deposited successfully!");
        setActiveSwap(null);
        fetchSwaps();
      }
    } catch (err) {
      console.error("Deposit error:", err);
      setMessage("❌ Failed to deposit battery.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Get user location
  useEffect(() => {
    setIsSorting(true);
    if (!navigator.geolocation) {
      setUserPos(null);
      setIsSorting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsSorting(false);
      },
      () => {
        setUserPos(null);
        setIsSorting(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Sort by distance
  useEffect(() => {
    if (!stations.length) {
      setSortedStations([]);
      return;
    }
    setIsSorting(true);
    if (!userPos) {
      setSortedStations(stations);
      setIsSorting(false);
      return;
    }

    const enriched = stations
      .map((s) => {
        const ll = getStationLatLng(s);
        if (!ll) return null;
        const dKm = haversineKm(userPos.lat, userPos.lng, ll.lat, ll.lng);
        return { ...s, _distanceKm: dKm };
      })
      .filter(Boolean)
      .sort((a, b) => a._distanceKm - b._distanceKm);

    setSortedStations(enriched);
    setIsSorting(false);
  }, [stations, userPos]);

  useEffect(() => {
    fetchSwaps();
    fetchStations();
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      <Sidebar />

      <div className="flex-grow ml-64 p-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-blue-600">My Swaps 🔋</h2>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition"
          >
            {showHistory ? "Hide History" : "Show History"}
          </button>
        </div>

        {message && (
          <p
            className={`mb-4 text-center ${
              message.includes("❌") ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}

        {/* 🔋 Active Swap Section */}
        {!showHistory && (
          <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 mb-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              {activeSwap ? "Active Swap Details" : "No Active Swaps"}
            </h3>

            {isSorting ? (
              <p className="text-center text-gray-600 py-8 text-lg font-medium">
                Fetching nearest stations...
              </p>
            ) : activeSwap ? (
              <div className="space-y-4">
                <p className="text-gray-700">
                  <strong>Borrowed From:</strong>{" "}
                  {activeSwap.sourceStation?.name || "Unknown"}
                </p>
                <p className="text-gray-700">
                  <strong>Swap Cost:</strong> ₹{activeSwap.swapCost}
                </p>
                <p className="text-gray-700">
                  <strong>Swapped At:</strong>{" "}
                  {new Date(activeSwap.swappedAt).toLocaleString()}
                </p>

                <div>
                  <label className="block font-semibold mb-3 text-gray-800">
                    Select Deposit Station (Nearest First):
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {sortedStations.map((s) => (
                      <button
                        key={s._id}
                        onClick={() => handleDeposit(s._id)}
                        disabled={isProcessing}
                        className={`p-3 rounded-lg text-white font-semibold flex flex-col items-center justify-center ${
                          isProcessing
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        <span>{s.name}</span>
                        <span className="text-xs text-gray-200 mt-1">
                          {s._distanceKm
                            ? `${s._distanceKm.toFixed(2)} km`
                            : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-lg">
                You don’t have any active swaps. Start one from{" "}
                <span
                  onClick={() => navigate("/swap")}
                  className="text-blue-600 font-semibold cursor-pointer hover:underline"
                >
                  Swap Battery
                </span>{" "}
                page.
              </p>
            )}
          </div>
        )}

        {/* 🕒 Swap History Section */}
        {showHistory && (
          <div className="overflow-x-auto bg-white shadow-xl rounded-xl border border-gray-200 p-6">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              Swap History
            </h3>
            {swaps.length === 0 ? (
              <p className="text-gray-600 text-lg">No swaps found.</p>
            ) : (
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-blue-100 text-gray-700">
                  <tr>
                    <th className="p-3 text-left">Borrowed From</th>
                    <th className="p-3 text-left">Deposited At</th>
                    <th className="p-3 text-left">Swap Cost</th>
                    <th className="p-3 text-left">Swapped At</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {swaps.map((s) => (
                    <tr
                      key={s._id}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="p-3">{s.sourceStation?.name || "—"}</td>
                      <td className="p-3">
                        {s.destinationStation?.name || "Not Deposited Yet"}
                      </td>
                      <td className="p-3 font-medium text-blue-700">
                        ₹{s.swapCost}
                      </td>
                      <td className="p-3 text-gray-700">
                        {new Date(s.swappedAt || s.time).toLocaleString()}
                      </td>
                      <td
                        className={`p-3 font-semibold ${
                          s.status === "Completed"
                            ? "text-green-600"
                            : s.status === "Active"
                            ? "text-yellow-600"
                            : "text-gray-700"
                        }`}
                      >
                        {s.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
