import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
        <button onClick={() => navigate("/booking")} className="bg-blue-600 px-4 py-2 rounded-lg font-semibold transition text-left">Book Slot</button>
        <button onClick={() => navigate("/my-bookings")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">My Bookings</button>
        <button onClick={() => navigate("/swap")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">Swap Battery</button>
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

// Helpers
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

export default function BookingPage() {
  const [stations, setStations] = useState([]);
  const [sortedStations, setSortedStations] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [selectedStation, setSelectedStation] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSorting, setIsSorting] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchStations = async () => {
    try {
      const res = await axios.get("https://cloudcharge-backend.onrender.com/api/stations");
      setStations(res.data || []);
    } catch (e) {
      console.error("Error fetching stations:", e);
    }
  };

  useEffect(() => {
    fetchStations();
    const t = setInterval(fetchStations, 30000);
    return () => clearInterval(t);
  }, []);

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

  // 💰 Smart cost estimation
  useEffect(() => {
    if (!startTime || !endTime || !selectedStation) {
      setEstimatedCost(null);
      return;
    }

    const stationObj = sortedStations.find((s) => s.name === selectedStation);
    if (!stationObj) return;

    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (hours <= 0) {
      setEstimatedCost(null);
      return;
    }

    const baseFee = 20; // service fee
    const avgPowerKw = 7.5; // charger output
    const rate = stationObj.pricePerKwh || 18;
    const energyUsed = avgPowerKw * hours;
    const total = baseFee + energyUsed * rate;
    setEstimatedCost(total.toFixed(2));
  }, [startTime, endTime, selectedStation, sortedStations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!selectedStation || !startTime || !endTime) {
        setMessage("Please select station and time range.");
        return;
      }

      const stationObj = sortedStations.find((s) => s.name === selectedStation);
      if (!stationObj) {
        setMessage("Invalid station selected.");
        return;
      }

      if (endTime <= startTime) {
        setMessage("End time must be after start time.");
        return;
      }

      const res = await axios.post("https://cloudcharge-backend.onrender.com/api/bookings", {
        userId: user?._id,
        stationId: stationObj._id,
        startTime,
        endTime,
      });

      if (res.status === 201) {
        alert(
          `✅ Booking Successful!\n\n📍 Station: ${stationObj.name}\n⏱ Duration: ${(
            (endTime - startTime) /
            (1000 * 60 * 60)
          ).toFixed(2)} hrs\n💡 Estimated Cost: ₹${estimatedCost}`
        );
        navigate("/my-bookings");
      }
    } catch (err) {
      console.error("Booking error:", err);
      setMessage("Booking failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      <Sidebar />

      <div className="flex-grow ml-64 p-10 flex flex-col items-center">
        <h2 className="text-3xl font-bold text-blue-600 mb-6 text-center">
          Book Your Charging Slot
        </h2>

        <div className="mb-6 bg-white shadow-lg rounded-xl p-5 border border-gray-200 w-full max-w-3xl">
          <h3 className="text-xl font-semibold text-gray-700 mb-3">
            Nearest Stations {userPos ? "" : "(waiting for location...)"}
          </h3>

          {isSorting ? (
            <p className="text-center text-gray-600 py-10 text-lg font-medium animate-pulse">
              🔍 Fetching nearest stations...
            </p>
          ) : sortedStations.length === 0 ? (
            <p className="text-gray-600 text-center py-6">No nearby stations found.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto pr-2">
              <ul className="space-y-2">
                {(showAll ? sortedStations : sortedStations.slice(0, 5)).map((s) => {
                  const badge =
                    s.status === "Available"
                      ? "border-green-400 bg-green-50"
                      : s.status === "Charging"
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-red-400 bg-red-50";
                  const dist =
                    typeof s._distanceKm === "number"
                      ? ` • ${s._distanceKm.toFixed(2)} km`
                      : "";
                  return (
                    <li
                      key={s._id}
                      className={`p-3 rounded-lg border ${badge} flex justify-between items-center`}
                    >
                      <div>
                        <span className="font-medium">{s.name}</span>
                        <span className="text-sm text-gray-600">
                          {" "}
                          ({s.status}
                          {dist})
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedStation(s.name)}
                        className="text-sm px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Use
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {sortedStations.length > 5 && !isSorting && (
            <div className="text-center mt-3">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-blue-600 font-semibold hover:underline"
              >
                {showAll ? "Show Less" : "Show All Stations"}
              </button>
            </div>
          )}
        </div>

        {/* Booking Form */}
        {!isSorting && sortedStations.length > 0 && (
          <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select Charging Station</option>
                {sortedStations.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name} — ₹{s.pricePerKwh}/kWh ({s.status})
                  </option>
                ))}
              </select>

              <div className="flex gap-6 justify-between">
                <div className="flex-1 text-center bg-gray-50 border border-gray-300 rounded-xl p-4 hover:shadow-sm transition">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Start Time
                  </label>
                  <DatePicker
                    selected={startTime}
                    onChange={(date) => setStartTime(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    placeholderText="Select start time"
                    className="w-full text-center border-none bg-transparent outline-none text-gray-700"
                  />
                </div>

                <div className="flex-1 text-center bg-gray-50 border border-gray-300 rounded-xl p-4 hover:shadow-sm transition">
                  <label className="block text-gray-700 font-semibold mb-2">
                    End Time
                  </label>
                  <DatePicker
                    selected={endTime}
                    onChange={(date) => setEndTime(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    placeholderText="Select end time"
                    className="w-full text-center border-none bg-transparent outline-none text-gray-700"
                  />
                </div>
              </div>

              {estimatedCost && (
                <div className="text-center text-lg font-semibold text-green-600">
                  💰 Estimated Cost: ₹{estimatedCost}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 text-white rounded-xl font-semibold transition-all ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? "Processing..." : "Confirm Booking"}
              </button>
            </form>

            {message && (
              <p
                className={`text-center text-sm mt-4 ${
                  message.includes("Success")
                    ? "text-green-600"
                    : message.includes("Start")
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
