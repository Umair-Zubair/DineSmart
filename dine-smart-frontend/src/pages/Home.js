import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../cssfiles/Home.css";

const API_BASE_URL = "https://dinesmart-backend.vercel.app"; // Backend URL

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [restaurantCuisines, setRestaurantCuisines] = useState([]);
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedRating, setSelectedRating] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");

  useEffect(() => {
    // Fetch Restaurants
    axios.get(`${API_BASE_URL}/restaurants`)
      .then((res) => {
        setRestaurants(res.data);
        // Extract unique locations from restaurants
        const uniqueLocations = [...new Set(res.data.map(r => r.location))];
        setLocations(uniqueLocations);
      })
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

  const handleCuisineChange = (cuisineName) => {
    setSelectedCuisines(prev => {
      if (prev.includes(cuisineName)) {
        return prev.filter(c => c !== cuisineName);
      } else {
        return [...prev, cuisineName];
      }
    });
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Filter restaurants based on selected cuisines, location, and rating
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesCuisine = selectedCuisines.length === 0 || restaurantCuisines.some(
      rc => rc.restaurant_id === restaurant.restaurant_id && selectedCuisines.includes(rc.cuisine_name)
    );
    const matchesLocation = !selectedLocation || restaurant.location === selectedLocation;
    const matchesRating = !selectedRating || Math.floor(restaurant.rating) === selectedRating;
    return matchesCuisine && matchesLocation && matchesRating;
  });

  // Sort restaurants by location
  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    return a.location.localeCompare(b.location);
  });

  const handleShowResults = () => {
    setIsFilterOpen(false);
  };

  return (
    <div className="home-container">
      <button className="filter-toggle" onClick={toggleFilter}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="21" x2="4" y2="14"/>
          <line x1="4" y1="10" x2="4" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12" y2="3"/>
          <line x1="20" y1="21" x2="20" y2="16"/>
          <line x1="20" y1="12" x2="20" y2="3"/>
          <line x1="1" y1="14" x2="7" y2="14"/>
          <line x1="9" y1="8" x2="15" y2="8"/>
          <line x1="17" y1="16" x2="23" y2="16"/>
        </svg>
      </button>

      <div className={`filter-container ${isFilterOpen ? 'open' : ''}`}>
        <div className="filter-section">
          <h3>Cuisine:</h3>
          <div className="cuisine-options">
            {cuisines.map((cuisine) => (
              <label key={cuisine.cuisine_name} className="cuisine-checkbox">
                <input
                  type="checkbox"
                  checked={selectedCuisines.includes(cuisine.cuisine_name)}
                  onChange={() => handleCuisineChange(cuisine.cuisine_name)}
                />
                {cuisine.cuisine_name}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h3>Location:</h3>
          <div className="location-options">
            <label className="location-radio">
              <input
                type="radio"
                name="location"
                value=""
                checked={selectedLocation === ""}
                onChange={(e) => setSelectedLocation(e.target.value)}
              />
              All Locations
            </label>
            {locations.map((location) => (
              <label key={location} className="location-radio">
                <input
                  type="radio"
                  name="location"
                  value={location}
                  checked={selectedLocation === location}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                />
                {location}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h3>Rating:</h3>
          <div className="rating-options">
            <label className="rating-checkbox">
              <input
                type="radio"
                name="rating"
                value=""
                checked={selectedRating === null}
                onChange={() => setSelectedRating(null)}
              />
              All Ratings
            </label>
            {[5, 4, 3, 2, 1].map((stars) => (
              <label key={stars} className="rating-checkbox">
                <input
                  type="radio"
                  name="rating"
                  value={stars}
                  checked={selectedRating === stars}
                  onChange={() => setSelectedRating(stars)}
                />
                {Array(stars).fill('⭐').join('')}
              </label>
            ))}
          </div>
        </div>

        <button className="show-results-btn" onClick={handleShowResults}>
          Show updated results
        </button>
      </div>

      <div className={`home-content ${!isFilterOpen ? 'filter-closed' : ''}`}>
        <div className="home-header">
          <h1 className="home-title">Browse Restaurants</h1>
        </div>

        <div className="home-grid">
          {sortedRestaurants.length > 0 ? (
            sortedRestaurants.map((r) => (
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
    </div>
  );
};

export default Home;