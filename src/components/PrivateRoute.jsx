import React from "react";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ element }) {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/login" replace />;
}
