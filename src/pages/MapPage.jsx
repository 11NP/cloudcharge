import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
  iconSize: [35, 35],
});

const stationIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/9131/9131604.png",
  iconSize: [30, 30],
});

export default function MapPage() {
  const [stations, setStations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.error(err)
    );
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/stations")
      .then((res) => setStations(res.data))
      .catch((err) => console.error("Error fetching stations:", err));
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        {userLocation ? (
          <MapContainer
            center={userLocation}
            zoom={6}
            style={{ height: "100vh", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={userLocation} icon={userIcon}>
              <Popup>Your Location 📍</Popup>
            </Marker>

            {stations.map((station, index) => (
              <Marker
                key={index}
                position={[
                  station.location.coordinates[1],
                  station.location.coordinates[0],
                ]}
                icon={stationIcon}
              >
                <Popup>
                  <strong>{station.name}</strong>
                  <br />
                  {station.location.address}
                  <br />
                  ₹{station.pricePerKwh}/kWh
                  <br />
                  <button
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
                    onClick={() =>
                      (window.location.href = `/booking?station=${encodeURIComponent(
                        station.name
                      )}`)
                    }
                  >
                    Book Now
                  </button>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-screen text-gray-600">
            Loading map...
          </div>
        )}
      </div>
    </div>
  );
}
