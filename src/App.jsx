import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import MapPage from "./pages/MapPage";
import BookingPage from "./pages/BookingPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import ProfilePage from "./pages/ProfilePage";
import PrivateRoute from "./components/PrivateRoute";

// 🔋 Import swap-related pages
import SwapPage from "./pages/SwapPage";
import MySwapsPage from "./pages/MySwapsPage";

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes */}
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/home" element={<PrivateRoute element={<HomePage />} />} />
      <Route path="/map" element={<PrivateRoute element={<MapPage />} />} />
      <Route path="/booking" element={<PrivateRoute element={<BookingPage />} />} />
      <Route path="/my-bookings" element={<PrivateRoute element={<MyBookingsPage />} />} />

      {/* 🔋 Swap routes */}
      <Route path="/swap" element={<PrivateRoute element={<SwapPage />} />} />
      <Route path="/my-swaps" element={<PrivateRoute element={<MySwapsPage />} />} />
    </Routes>
  );
}
