import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Restaurant from "./pages/Restaurant";
import Reservation from "./pages/Reservation";
import PreOrder from "./pages/Pre-order";
import Reviews from "./pages/Reviews"; // Import the new Reviews component
import AdminDashboard from "./pages/AdminDashboard";
import Header from "./components/Header";

const App = () => {
  // Admin route check function - used as an element renderer
  const AdminRoute = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // If no user is logged in or user is not an admin (role 0), redirect to home
    if (!user || user.role !== 0) {
      return <Navigate to="/" />;
    }
    
    // If user is an admin, render the admin component
    return <AdminDashboard />;
  };

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/restaurant/:restaurant_id" element={<Restaurant />} />
        <Route path="/restaurant/:restaurant_id/reserve" element={<Reservation />} />
        <Route path="/restaurant/:restaurant_id/preorder" element={<PreOrder />} />
        <Route path="/preorder/:restaurant_id?" element={<PreOrder />} />
        <Route path="/pre-order/:restaurant_id?" element={<PreOrder />} />
        <Route path="/pre-order" element={<PreOrder />} />
        <Route path="/reviews" element={<Reviews />} /> {/* Add the new Reviews route */}
        
        {/* Admin route with protection */}
        <Route path="/admin" element={<AdminRoute />} />
      </Routes>
    </Router>
  );
};

export default App;