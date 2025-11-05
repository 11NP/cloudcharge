import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
      const res = await axios.post("http://localhost:5000/api/users/register", form);
      setMessage("✅ Registration successful! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } catch {
      setMessage("❌ Registration failed.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Create Account</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="text" name="name" placeholder="Full Name" onChange={handleChange} className="w-full px-4 py-3 border rounded-xl" />
          <input type="email" name="email" placeholder="Email Address" onChange={handleChange} className="w-full px-4 py-3 border rounded-xl" />
          <input type="password" name="password" placeholder="Password" onChange={handleChange} className="w-full px-4 py-3 border rounded-xl" />
          <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold">Register</button>
        </form>
        {message && <p className="text-center mt-4">{message}</p>}
        <p className="text-center mt-6 text-gray-500">
          Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
}
