import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

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
        <button onClick={() => navigate("/home")} className="bg-blue-600 px-4 py-2 rounded-lg font-semibold text-left">
          Home
        </button>
        <button onClick={() => navigate("/booking")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">
          Book Slot
        </button>
        <button onClick={() => navigate("/my-bookings")} className="hover:bg-blue-600 px-4 py-2 rounded-lg transition text-left">
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
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 py-2 rounded-lg mt-4 font-semibold"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

// Helper to extract lat/lng
const getStationLatLng = (s) => {
  const coords = s?.location?.coordinates;
  if (Array.isArray(coords) && coords.length >= 2) {
    return { lat: Number(coords[1]), lng: Number(coords[0]) };
  }
  if (typeof s?.latitude === "number" && typeof s?.longitude === "number") {
    return { lat: s.latitude, lng: s.longitude };
  }
  return null;
};

export default function HomePage() {
  const [stations, setStations] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/stations")
      .then((res) => setStations(res.data || []))
      .catch((err) => console.error("Failed to fetch stations", err));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserPos(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const renderMap = (isFull) => (
    <MapContainer
      center={userPos ? [userPos.lat, userPos.lng] : [20.5937, 78.9629]}
      zoom={userPos ? 13 : 5}
      style={{
        height: isFull ? "100vh" : "400px",
        width: "100%",
        borderRadius: isFull ? "0px" : "12px",
        cursor: "pointer",
      }}
      onClick={() => {
        if (!isFull) setIsFullscreen(true);
      }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {userPos && (
        <Marker
          position={[userPos.lat, userPos.lng]}
          icon={L.icon({
            iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            iconSize: [32, 32],
          })}
        >
          <Popup>You are here</Popup>
        </Marker>
      )}

      {stations.map((s) => {
        const ll = getStationLatLng(s);
        if (!ll) return null;
        const colorIcon = L.icon({
          iconUrl:
            s.status === "Available"
              ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
              : s.status === "Charging"
              ? "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
              : "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
          iconSize: [32, 32],
        });
        return (
          <Marker key={s._id} position={[ll.lat, ll.lng]} icon={colorIcon}>
            <Popup>
              <b>{s.name}</b> <br />
              Status: {s.status || "Unknown"} <br />
              ₹{s.pricePerKwh || "N/A"}/kWh
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 relative">
      <Sidebar />

      <div className="flex-grow ml-64 p-10">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-6">
          Welcome to CloudCharge
        </h1>
        <p className="text-gray-700 text-lg mb-8">
          Your all-in-one EV charging and battery swapping management platform.
          Track, book, and explore all nearby charging or swap stations in real time.
        </p>

        {/* Map Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-10 p-4">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            All Charging Stations Map
          </h2>
          {stations.length === 0 ? (
            <p className="text-gray-600">Loading map data...</p>
          ) : (
            renderMap(false)
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
          <div
            onClick={() => navigate("/booking")}
            className="cursor-pointer bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl hover:bg-blue-50 transition"
          >
            <h3 className="text-xl font-semibold text-blue-600 mb-2">Book a Slot</h3>
            <p className="text-gray-600">Reserve your preferred charging time instantly.</p>
          </div>

          <div
            onClick={() => navigate("/swap")}
            className="cursor-pointer bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl hover:bg-green-50 transition"
          >
            <h3 className="text-xl font-semibold text-green-600 mb-2">Swap Battery</h3>
            <p className="text-gray-600">Find and perform a quick battery swap nearby.</p>
          </div>

          <div
            onClick={() => navigate("/my-swaps")}
            className="cursor-pointer bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl hover:bg-yellow-50 transition"
          >
            <h3 className="text-xl font-semibold text-yellow-600 mb-2">My Swaps</h3>
            <p className="text-gray-600">Check your past swap history and costs.</p>
          </div>

          <div
            onClick={() => navigate("/my-bookings")}
            className="cursor-pointer bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl hover:bg-indigo-50 transition"
          >
            <h3 className="text-xl font-semibold text-indigo-600 mb-2">My Bookings</h3>
            <p className="text-gray-600">Track or manage your active and past charging sessions.</p>
          </div>

          <div
            onClick={() => navigate("/profile")}
            className="cursor-pointer bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl hover:bg-red-50 transition"
          >
            <h3 className="text-xl font-semibold text-red-600 mb-2">Profile</h3>
            <p className="text-gray-600">Update your personal info and preferences.</p>
          </div>
        </div>

        {/* Station List */}
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            All Charging Stations
          </h2>
          {stations.length === 0 ? (
            <p className="text-gray-600">No stations found.</p>
          ) : (
            <ul className="space-y-3">
              {stations.map((s) => (
                <li
                  key={s._id}
                  className="p-4 rounded-lg border border-gray-200 bg-blue-50 flex justify-between items-center"
                >
                  <div>
                    <span className="font-medium">{s.name}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({s.status || "Unknown"})
                    </span>
                  </div>
                  <button
                    onClick={() => navigate("/booking")}
                    className="text-sm px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Book Now
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Fullscreen Map Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col">
          <div className="flex justify-end p-4">
            <button
              onClick={() => setIsFullscreen(false)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Close Map ✕
            </button>
          </div>
          <div className="flex-grow">{renderMap(true)}</div>
        </div>
      )}
    </div>
  );
}
