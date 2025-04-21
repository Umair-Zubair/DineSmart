import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../cssfiles/Pre-order.css";

const API_BASE_URL = "https://dinesmart-backend.vercel.app";

const PreOrder = () => {
  const { restaurant_id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [userReservations, setUserReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    const userJson = localStorage.getItem("user");
    
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        setCurrentUser(user);
      } catch (err) {
        console.error("Error parsing user data:", err);
        setError("Session error. Please login again using the header menu.");
        setLoading(false);
      }
    } else {
      setError("You must be logged in to place a pre-order. Please use the login button in the header menu.");
      setLoading(false);
    }
  }, []);

  // Fetch user's reservations and restaurant data
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);

    // Fetch user's reservations
    axios.get(`${API_BASE_URL}/reservations?user_id=${currentUser.user_id}`)
      .then((reservationsRes) => {
        const reservations = reservationsRes.data;
        
        if (reservations.length === 0) {
          setError("You don't have any reservations. Please make a reservation before placing a pre-order.");
          setLoading(false);
          return;
        }

        // Filter for active reservations (status 0 = pending, 1 = confirmed)
        const activeReservations = reservations.filter(r => r.status === 0 || r.status === 1);
        
        if (activeReservations.length === 0) {
          setError("You don't have any active reservations. Please make a reservation before placing a pre-order.");
          setLoading(false);
          return;
        }

        // Add restaurant_name if available in reservation data
        const enhancedReservations = activeReservations.map(res => ({
          ...res,
          date_formatted: new Date(res.date).toLocaleDateString(),
          time_formatted: res.time
        }));

        setUserReservations(enhancedReservations);
        
        // If restaurant_id is provided, select that reservation
        if (restaurant_id) {
          const matchingReservation = enhancedReservations.find(
            r => r.restaurant_id === parseInt(restaurant_id, 10)
          );
          
          if (matchingReservation) {
            setSelectedReservation(matchingReservation);
          } else {
            // If no matching reservation, select the first one
            setSelectedReservation(enhancedReservations[0]);
          }
        } else {
          // If no restaurant_id provided, select the first reservation
          setSelectedReservation(enhancedReservations[0]);
        }
        
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching reservations:", err);
        setError("Failed to load your reservations. Please try again later.");
        setLoading(false);
      });
  }, [currentUser, restaurant_id]);

  // Fetch restaurant and menu data when a reservation is selected
  useEffect(() => {
    if (!selectedReservation) return;
    
    setLoading(true);
    
    // Fetch restaurant info and menu items
    Promise.all([
      axios.get(`${API_BASE_URL}/restaurants/${selectedReservation.restaurant_id}`),
      axios.get(`${API_BASE_URL}/menu-items/${selectedReservation.restaurant_id}`)
    ])
    .then(([restaurantRes, menuItemsRes]) => {
      setRestaurant(restaurantRes.data);
      
      // Sort menu items by name for better UI experience
      const sortedMenuItems = menuItemsRes.data.sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      setMenuItems(sortedMenuItems);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Error fetching restaurant data:", err);
      setError("Failed to load restaurant menu. Please try again later.");
      setLoading(false);
    });
  }, [selectedReservation]);

  const handleReservationChange = (e) => {
    const reservationId = parseInt(e.target.value, 10);
    const reservation = userReservations.find(r => r.reservation_id === reservationId);
    setSelectedReservation(reservation);
    // Clear cart when changing reservations
    setCartItems([]);
  };

  const addToCart = (menuItem) => {
    const existingItemIndex = cartItems.findIndex(item => item.item_id === menuItem.item_id);
    
    if (existingItemIndex >= 0) {
      // Item already in cart, update quantity
      const updatedCart = [...cartItems];
      updatedCart[existingItemIndex].quantity += 1;
      setCartItems(updatedCart);
    } else {
      // Add new item to cart
      setCartItems([...cartItems, { ...menuItem, quantity: 1 }]);
    }
  };

  const removeFromCart = (menuItem) => {
    const existingItemIndex = cartItems.findIndex(item => item.item_id === menuItem.item_id);
    
    if (existingItemIndex >= 0) {
      const updatedCart = [...cartItems];
      if (updatedCart[existingItemIndex].quantity > 1) {
        // Reduce quantity if more than 1
        updatedCart[existingItemIndex].quantity -= 1;
      } else {
        // Remove item if quantity is 1
        updatedCart.splice(existingItemIndex, 1);
      }
      setCartItems(updatedCart);
    }
  };

  const calculateTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0).toFixed(2);
  }, [cartItems]);

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) {
      setError("Your cart is empty. Please add items to your order.");
      return;
    }

    setLoading(true);

    try {
      // Prepare order data
      const orderData = {
        user_id: currentUser.user_id,
        restaurant_id: selectedReservation.restaurant_id,
        order_status: 0, // Pending
        reservation_id: selectedReservation.reservation_id
      };

      // Create order first
      const orderRes = await axios.post(`${API_BASE_URL}/orders`, orderData);
      const newOrderId = orderRes.data.order_id;

      // Then add order items
      const orderItemPromises = cartItems.map(item => 
        axios.post(`${API_BASE_URL}/order-items`, {
          order_id: newOrderId,
          item_id: item.item_id,
          quantity: item.quantity
        })
      );

      await Promise.all(orderItemPromises);

      setOrderStatus({
        success: true,
        message: `Your order is confirmed for ${selectedReservation.date_formatted || new Date(selectedReservation.date).toLocaleDateString()} at ${selectedReservation.time_formatted || selectedReservation.time}`,
        data: orderRes.data
      });
      
      setCartItems([]);
      setLoading(false);
    } catch (err) {
      console.error("Error placing order:", err);
      setOrderStatus({
        success: false,
        message: err.response?.data?.error || "Failed to place your order. Please try again."
      });
      setLoading(false);
    }
  };

  const handleCloseConfirmation = () => {
    if (orderStatus?.success) {
      navigate(`/restaurant/${selectedReservation.restaurant_id}`);
    } else {
      setOrderStatus(null);
    }
  };

  // Group menu items by category (you could extend this based on your menu structure)
  const groupMenuItems = () => {
    // This is a simple example. You might want to add categories to your menu items in the database
    const starters = menuItems.filter(item => 
      item.name.toLowerCase().includes('salad') || 
      item.name.toLowerCase().includes('soup') ||
      item.price < 10
    );
    
    const mains = menuItems.filter(item => 
      !starters.includes(item) && 
      !item.name.toLowerCase().includes('dessert') &&
      !item.name.toLowerCase().includes('drink')
    );
    
    const desserts = menuItems.filter(item => 
      item.name.toLowerCase().includes('dessert') ||
      item.name.toLowerCase().includes('cake') ||
      item.name.toLowerCase().includes('ice cream')
    );
    
    return { starters, mains, desserts };
  };

  if (loading && !error) return <div className="loading">Loading pre-order system...</div>;

  return (
    <div className="pre-order-container">
      {error ? (
        <div className="error-container">
          <div className="error">{error}</div>
          <button 
            className="return-button" 
            onClick={() => navigate("/")}
          >
            Return to Home
          </button>
        </div>
      ) : orderStatus ? (
        <div className="order-confirmation">
          <div className="confirmation-content">
            <h2>{orderStatus.success ? "Success!" : "Error"}</h2>
            <p>{orderStatus.message}</p>
            <button className="confirm-button" onClick={handleCloseConfirmation}>Okay</button>
          </div>
        </div>
      ) : (
        currentUser && selectedReservation && (
          <>
            <div className="pre-order-header">
              <h1>Pre-Order Meal</h1>
              {userReservations.length > 1 && (
                <div className="reservation-selector">
                  <label htmlFor="reservation-select">Select Reservation:</label>
                  <select 
                    id="reservation-select" 
                    value={selectedReservation.reservation_id}
                    onChange={handleReservationChange}
                  >
                    {userReservations.map(res => (
                      <option key={res.reservation_id} value={res.reservation_id}>
                        {res.restaurant_name || `Restaurant #${res.restaurant_id}`} - {res.date_formatted || new Date(res.date).toLocaleDateString()} at {res.time_formatted || res.time}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {restaurant && (
              <div className="restaurant-info">
                <h2>{restaurant.name}</h2>
                <p className="restaurant-location">{restaurant.location}</p>
                <div className="reservation-details">
                  <p>Your reservation: {selectedReservation.date_formatted || new Date(selectedReservation.date).toLocaleDateString()} at {selectedReservation.time_formatted || selectedReservation.time}</p>
                  <p>Guests: {selectedReservation.guests}</p>
                </div>
              </div>
            )}
            
            <div className="pre-order-content">
              <div className="menu-section">
                <h3>Menu</h3>
                {menuItems.length > 0 ? (
                  <ul className="menu-list">
                    {menuItems.map((item) => (
                      <li key={item.item_id} className="menu-item">
                        <div className="menu-item-content">
                          {item.image_url && (
                            <div className="menu-item-image">
                              <img src={item.image_url} alt={item.name} />
                            </div>
                          )}
                          <div className="menu-item-details">
                            <h4>{item.name}</h4>
                            <p>{item.description}</p>
                            <span className="menu-price">${parseFloat(item.price).toFixed(2)}</span>
                          </div>
                        </div>
                        <button 
                          className="add-to-cart-button" 
                          onClick={() => addToCart(item)}
                          disabled={!item.availability}
                        >
                          Add to Cart
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-menu-items">No menu items available for this restaurant.</p>
                )}
              </div>
              
              <div className="cart-section">
                <h3>Cart</h3>
                {cartItems.length > 0 ? (
                  <>
                    <ul className="cart-items-list">
                      {cartItems.map((item) => (
                        <li key={item.item_id} className="cart-item">
                          <div className="cart-item-info">
                            <span className="cart-item-name">{item.name}</span>
                            <span className="cart-item-price">${parseFloat(item.price).toFixed(2)}</span>
                          </div>
                          <div className="cart-item-quantity">
                            <button 
                              className="quantity-button"
                              onClick={() => removeFromCart(item)}
                            >
                              -
                            </button>
                            <span>{item.quantity}</span>
                            <button 
                              className="quantity-button"
                              onClick={() => addToCart(item)}
                            >
                              +
                            </button>
                          </div>
                          <div className="cart-item-subtotal">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="cart-total">
                      <span>Total:</span>
                      <span>${calculateTotal()}</span>
                    </div>
                    <button 
                      className="confirm-order-button"
                      onClick={handleSubmitOrder}
                    >
                      Confirm Pre-Order
                    </button>
                  </>
                ) : (
                  <p className="empty-cart">Your cart is empty. Add items from the menu.</p>
                )}
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
};

export default PreOrder;