import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/home");
  }, [navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("https://cloudcharge-backend.onrender.com/api/users/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify({
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
      }));
      setMessage("✅ Login successful! Redirecting...");
      setTimeout(() => navigate("/home"), 1200);
    } catch (err) {
      setMessage("❌ Invalid credentials.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Welcome Back 👋</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="email" name="email" placeholder="Email" onChange={handleChange} className="w-full px-4 py-3 border rounded-xl" />
          <input type="password" name="password" placeholder="Password" onChange={handleChange} className="w-full px-4 py-3 border rounded-xl" />
          <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold">Login</button>
        </form>
        {message && <p className="text-center mt-4">{message}</p>}
        <p className="text-center mt-6 text-gray-500">
          No account? <Link to="/register" className="text-blue-600">Register</Link>
        </p>
      </div>
    </div>
  );
}
