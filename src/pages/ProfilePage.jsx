import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar"; // ensure Sidebar is updated to your unified version

export default function ProfilePage() {
  const userData = JSON.parse(localStorage.getItem("user"));
  const [user, setUser] = useState(userData || {});
  const [editable, setEditable] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!userData) {
      setMessage("User not found. Please log in again.");
    }
  }, [userData]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await axios.put(`https://cloudcharge-backend.onrender.com/api/users/${user._id}`, {
        name: user.name,
        password: user.password,
      });
      localStorage.setItem("user", JSON.stringify(res.data.updatedUser));
      setMessage("Profile updated successfully!");
      setEditable(false);
    } catch (err) {
      console.error("Profile update error:", err);
      setMessage("Failed to update profile.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-grow ml-64 flex items-center justify-center px-6 py-10">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg border border-gray-200">
          <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
            My Profile
          </h2>

          {message && (
            <p
              className={`text-center mb-4 ${
                message.includes("successfully")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={user.name || ""}
                onChange={handleChange}
                disabled={!editable}
                className={`w-full px-4 py-3 border rounded-xl ${
                  editable
                    ? "border-blue-400 focus:ring-2 focus:ring-blue-400"
                    : "border-gray-300 bg-gray-100"
                }`}
              />
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email || ""}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500"
              />
            </div>

            {editable && (
              <div>
                <label className="block text-gray-600 font-semibold mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter new password"
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-400"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between mt-8">
            {!editable ? (
              <button
                onClick={() => setEditable(true)}
                className="bg-blue-600 text-white py-2 px-6 rounded-xl hover:bg-blue-700 transition-all"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="bg-green-600 text-white py-2 px-6 rounded-xl hover:bg-green-700 transition-all"
              >
                Save Changes
              </button>
            )}

           
              
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
