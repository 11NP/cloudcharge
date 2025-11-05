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
      <h2 className="text-2xl font-bold mb-10 text-left pl-2">CloudCharge</h2>
      <nav className="flex flex-col space-y-4 text-left">
        <button onClick={() => navigate("/home")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">Home</button>
        <button onClick={() => navigate("/booking")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">Book Slot</button>
        <button onClick={() => navigate("/my-bookings")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">My Bookings</button>
        <button onClick={() => navigate("/swap")} className="bg-blue-600 px-4 py-2 rounded-lg font-semibold transition text-left">Swap Battery</button>
        <button onClick={() => navigate("/my-swaps")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">My Swaps</button>
        <button onClick={() => navigate("/profile")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">Profile</button>
      </nav>
      <div className="mt-auto">
        <button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 py-2 rounded-lg mt-4 font-semibold text-left px-4">
          Logout
        </button>
      </div>
    </div>
  );
}

// Geo helpers
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

export default function SwapPage() {
  const [stations, setStations] = useState([]);
  const [sortedStations, setSortedStations] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [activeSwap, setActiveSwap] = useState(null);
  const [swapHistory, setSwapHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSorting, setIsSorting] = useState(true);
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const fetchStations = async () => {
    try {
      const res = await axios.get("https://cloudcharge-backend.onrender.com/api/stations");
      setStations(res.data || []);
    } catch (e) {
      console.error("Error fetching stations:", e);
    }
  };

  const fetchActiveSwap = async () => {
    try {
      const res = await axios.get(`https://cloudcharge-backend.onrender.com/api/swaps/active/${user?._id}`);
      setActiveSwap(res.data || null);
    } catch {
      setActiveSwap(null);
    }
  };

  const fetchSwapHistory = async () => {
    try {
      const res = await axios.get(`https://cloudcharge-backend.onrender.com/api/swaps/user/${user?._id}`);
      setSwapHistory(res.data || []);
    } catch (err) {
      console.error("Failed to fetch swap history:", err);
    }
  };

  useEffect(() => {
    fetchStations();
    fetchActiveSwap();
    fetchSwapHistory();
    const t = setInterval(fetchStations, 30000);
    return () => clearInterval(t);
  }, []);

  // Geo sorting
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
      },
      () => {
        setUserPos(null);
        setIsSorting(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (!stations.length || userPos === null) return;
    setIsSorting(true);
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

  const handleBorrow = async (stationId) => {
    if (isProcessing || activeSwap) return;
    setIsProcessing(true);
    try {
      const res = await axios.post("https://cloudcharge-backend.onrender.com/api/swaps", {
        userId: user?._id,
        sourceStation: stationId,
      });
      if (res.status === 201) {
        alert("✅ Battery borrowed successfully! You can deposit it later.");
        setActiveSwap(res.data.swap);
        fetchStations();
      }
    } catch (err) {
      console.error("Borrow error:", err);
      setMessage("Failed to borrow battery. Try again later.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ❌ Cancel active swap
  const handleCancelSwap = async () => {
    if (!activeSwap) return;
    if (!window.confirm("Are you sure you want to cancel this battery swap?")) return;
    setIsProcessing(true);
    try {
      const res = await axios.patch(`https://cloudcharge-backend.onrender.com/api/swaps/${activeSwap._id}/cancel`);
      if (res.status === 200) {
        alert("❌ Swap cancelled successfully.");
        setActiveSwap(null);
        fetchSwapHistory();
        fetchStations();
      }
    } catch (err) {
      console.error("Cancel swap error:", err);
      setMessage("Failed to cancel swap. Try again later.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      <Sidebar />
      <div className="flex-grow ml-64 p-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-blue-600">
            {activeSwap ? "Active Swap In Progress" : "Swap Your Battery"}
          </h2>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition"
          >
            {showHistory ? "Hide History" : "Show History"}
          </button>
        </div>

        {!showHistory ? (
          <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-200">
            {isSorting ? (
              <p className="text-center text-gray-600 py-10 text-lg font-medium animate-pulse">
                🔍 Fetching nearest stations...
              </p>
            ) : activeSwap ? (
              <div className="text-center py-8">
                <p className="text-gray-700 text-lg mb-3">
                  You currently have an <strong>active battery swap</strong>.
                </p>
                <p className="text-gray-600 mb-4">
                  Borrowed from:{" "}
                  <strong>{activeSwap.sourceStation?.name || "Unknown"}</strong>
                </p>
                <p className="text-gray-600 mb-6">
                  Swap started at:{" "}
                  <strong>{new Date(activeSwap.swappedAt).toLocaleString()}</strong>
                </p>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => navigate("/my-swaps")}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                  >
                    Go to My Swaps →
                  </button>
                  <button
                    onClick={handleCancelSwap}
                    disabled={isProcessing}
                    className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
                  >
                    {isProcessing ? "Cancelling..." : "Cancel Swap"}
                  </button>
                </div>
              </div>
            ) : sortedStations.length === 0 ? (
              <p className="text-gray-600 text-center">No nearby stations found.</p>
            ) : (
              sortedStations.map((s) => {
                const badge =
                  s.chargedBatteries > 10
                    ? "border-green-400 bg-green-50"
                    : s.chargedBatteries > 0
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-red-400 bg-red-50";
                const dist =
                  typeof s._distanceKm === "number"
                    ? ` • ${s._distanceKm.toFixed(2)} km`
                    : "";
                return (
                  <div
                    key={s._id}
                    className={`p-4 mb-3 border ${badge} rounded-lg flex justify-between items-center transition`}
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{s.name}</p>
                      <p className="text-sm text-gray-600">
                        Charged: {s.chargedBatteries}/{s.totalBatteries} | Charging:{" "}
                        {s.chargingBatteries || 0} {dist}
                      </p>
                    </div>
                    <button
                      onClick={() => handleBorrow(s._id)}
                      disabled={s.chargedBatteries === 0 || isProcessing}
                      className={`px-4 py-2 rounded-lg text-white font-semibold ${
                        s.chargedBatteries === 0
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      Swap Now
                    </button>
                  </div>
                );
              })
            )}
            {message && (
              <p className="text-center mt-4 text-red-600 font-medium">{message}</p>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">Swap History</h3>
            {swapHistory.length === 0 ? (
              <p className="text-gray-600 text-center">No past swaps found.</p>
            ) : (
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-blue-100 text-gray-700">
                  <tr>
                    <th className="p-3 text-left">Borrowed From</th>
                    <th className="p-3 text-left">Deposited At</th>
                    <th className="p-3 text-left">Cost</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {swapHistory.map((swap) => (
                    <tr key={swap._id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{swap.sourceStation?.name || "—"}</td>
                      <td className="p-3">
                        {swap.destinationStation?.name || "Not Deposited"}
                      </td>
                      <td className="p-3 text-blue-600 font-medium">₹{swap.swapCost}</td>
                      <td className="p-3">{new Date(swap.swappedAt).toLocaleString()}</td>
                      <td
                        className={`p-3 font-semibold ${
                          swap.status === "Completed"
                            ? "text-green-600"
                            : swap.status === "Cancelled"
                            ? "text-red-600"
                            : swap.status === "Active"
                            ? "text-yellow-600"
                            : "text-gray-600"
                        }`}
                      >
                        {swap.status}
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
