import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "../cssfiles/Restaurant.css";

const API_BASE_URL = "https://dinesmart-backend.vercel.app";

const Restaurant = () => {
  const { restaurant_id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!restaurant_id) {
      console.error("No restaurant_id found in URL params");
      setError("Restaurant ID is missing");
      setLoading(false);
      return;
    }

    console.log("Fetching data for restaurant:", restaurant_id);

    const id = parseInt(restaurant_id, 10);
    
    if (isNaN(id)) {
      console.error("Invalid restaurant_id:", restaurant_id);
      setError("Invalid restaurant ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Modified approach: First fetch all restaurants, then filter by ID
    Promise.all([
      axios.get(`${API_BASE_URL}/restaurants`),
      axios.get(`${API_BASE_URL}/menu-items/${id}`)
    ])
    .then(([restaurantsRes, menuRes]) => {
      console.log("Fetched all restaurants:", restaurantsRes.data);
      console.log("Fetched menu items:", menuRes.data);
      
      // Find the specific restaurant by ID from the list
      const foundRestaurant = restaurantsRes.data.find(
        (rest) => rest.id === id || rest.restaurant_id === id
      );
      
      if (!foundRestaurant) {
        console.error("Restaurant not found in results");
        setError("Restaurant not found");
        setLoading(false);
        return;
      }
      
      console.log("Found restaurant:", foundRestaurant);
      setRestaurant(foundRestaurant);
      setMenuItems(menuRes.data);
    })
    .catch((err) => {
      console.error("Error fetching data:", err);
      setError("Failed to load restaurant data");
    })
    .finally(() => {
      setLoading(false);
      console.log("API Calls Finished");
    });

  }, [restaurant_id]);

  // For debugging
  useEffect(() => {
    console.log("Current restaurant_id from params:", restaurant_id);
  }, [restaurant_id]);

  if (loading) return <div className="loading">Loading restaurant...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="restaurant-container">
      {restaurant ? (
        <>
          <h1 className="restaurant-header">{restaurant.name}</h1>
          <p className="restaurant-location">{restaurant.location}</p>
          
          <div className="menu-container">
            <h2 className="menu-title">Menu</h2>
            {menuItems && menuItems.length > 0 ? (
              <ul className="menu-list">
                {menuItems.map((item) => (
                  <li key={item.item_id} className="menu-item">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <span className="menu-price">${item.price}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No menu items available for this restaurant.</p>
            )}
          </div>

          {/* Updated reserve button with Link */}
          <Link to={`/restaurant/${restaurant_id}/reserve`} className="reserve-button">
            Reserve a Table
          </Link>
        </>
      ) : (
        <p>Restaurant not found.</p>
      )}
    </div>
  );
};

export default Restaurant;