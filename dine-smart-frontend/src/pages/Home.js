import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../cssfiles/Home.css";

const API_BASE_URL = "https://dinesmart-backend.vercel.app"; // Backend URL

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [restaurantCuisines, setRestaurantCuisines] = useState([]); // Bridge table
  const [selectedCuisine, setSelectedCuisine] = useState("");

  useEffect(() => {
    // Fetch Restaurants
    axios.get(`${API_BASE_URL}/restaurants`)
      .then((res) => setRestaurants(res.data))
      .catch((err) => console.error("Error fetching restaurants:", err));

    // Fetch Cuisines
    axios.get(`${API_BASE_URL}/cuisines`)
      .then((res) => setCuisines(res.data))
      .catch((err) => console.error("Error fetching cuisines:", err));

    // Fetch All Restaurant-Cuisine Mappings
    axios.get(`${API_BASE_URL}/restaurant-cuisines`)
      .then((res) => setRestaurantCuisines(res.data))
      .catch((err) => console.error("Error fetching restaurant_cuisines:", err));
  }, []);

  // Filter restaurants based on selected cuisine
  const filteredRestaurants = selectedCuisine
    ? restaurants.filter((restaurant) =>
        restaurantCuisines.some(
          (rc) =>
            rc.restaurant_id === restaurant.restaurant_id &&
            rc.cuisine_name === selectedCuisine
        )
      )
    : restaurants;

  return (
    <div className="home-container">
      <h1 className="home-title">Browse Restaurants</h1>

      {/* Cuisine Filter Dropdown */}
      <select
        onChange={(e) => setSelectedCuisine(e.target.value)}
        className="home-filter"
      >
        <option value="">All Cuisines</option>
        {cuisines.map((c) => (
          <option key={c.cuisine_name} value={c.cuisine_name}>
            {c.cuisine_name}
          </option>
        ))}
      </select>

      {/* Restaurants Grid */}
      <div className="home-grid">
        {filteredRestaurants.length > 0 ? (
          filteredRestaurants.map((r) => (
            <Link
              to={`/restaurant/${r.restaurant_id}`}
              key={r.restaurant_id}
              className="home-card"
            >
              <img
                src={r.image_url || "https://via.placeholder.com/300.png"}
                alt={r.name}
                className="home-card-image"
              />
              <div className="home-card-content">
                <h2 className="home-card-title">{r.name}</h2>
                <p className="home-card-location">{r.location}</p>
                <p className="home-card-rating">⭐ {r.rating}</p>
              </div>
            </Link>
          ))
        ) : (
          <p className="home-no-data">No restaurants available.</p>
        )}
      </div>
    </div>
  );
};

export default Home;
