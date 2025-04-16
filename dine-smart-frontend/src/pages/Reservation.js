import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../cssfiles/Reservation.css";

const API_BASE_URL = "https://dinesmart-backend.vercel.app";

const Reservation = () => {
  const { restaurant_id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [bookedTables, setBookedTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservationStatus, setReservationStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [existingReservations, setExistingReservations] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Used to force refresh
  
  // Reservation form state
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    guests: 1,
    table_id: null, // Changed from table_no to table_id to match backend
    status: 0 // Pending status (0 = pending, 1 = confirmed, 2 = cancelled)
  });

  // Calculated end time (1 hour after start time)
  const [endTime, setEndTime] = useState("");

  // Helper function to check time overlap
  const checkTimeOverlap = (time1, time2) => {
    // Parse the time values
    const time1Parts = time1.split(':');
    const time1Hours = parseInt(time1Parts[0], 10);
    const time1Minutes = parseInt(time1Parts[1], 10);
    
    const time2Parts = time2.split(':');
    const time2Hours = parseInt(time2Parts[0], 10);
    const time2Minutes = parseInt(time2Parts[1], 10);
    
    // Convert to minutes for easier comparison
    const time1InMinutes = (time1Hours * 60) + time1Minutes;
    const time2InMinutes = (time2Hours * 60) + time2Minutes;
    
    // Calculate end times (1 hour later)
    const time1EndInMinutes = time1InMinutes + 60;
    const time2EndInMinutes = time2InMinutes + 60;
    
    // Check for time overlap
    return time1InMinutes < time2EndInMinutes && time1EndInMinutes > time2InMinutes;
  };

  // Check if user is logged in
  useEffect(() => {
    // Get user info from local storage
    const userJson = localStorage.getItem("user");
    
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        setCurrentUser(user);
      } catch (err) {
        console.error("Error parsing user data:", err);
        setError("Session error. Please login again using the header menu.");
      }
    } else {
      setError("You must be logged in to make a reservation. Please use the login button in the header menu.");
      setLoading(false);
    }
  }, []);

  // Calculate end time when start time changes
  useEffect(() => {
    if (formData.time) {
      const [hours, minutes] = formData.time.split(':').map(num => parseInt(num, 10));
      
      // Calculate 1 hour later
      let endHours = hours + 1;
      if (endHours >= 24) {
        endHours -= 24;
      }
      
      // Format with leading zeros if needed
      const formattedEndHours = endHours.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      
      setEndTime(`${formattedEndHours}:${formattedMinutes}`);
    } else {
      setEndTime("");
    }
  }, [formData.time]);

  // Fetch restaurant and tables data
  useEffect(() => {
    // Don't fetch data if no user is logged in
    if (!currentUser) return;
    
    if (!restaurant_id) {
      setError("Restaurant ID is missing");
      setLoading(false);
      return;
    }

    const id = parseInt(restaurant_id, 10);
    
    if (isNaN(id)) {
      setError("Invalid restaurant ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch restaurant info and tables
    Promise.all([
      axios.get(`${API_BASE_URL}/restaurants`),
      axios.get(`${API_BASE_URL}/tables/${id}`)
    ])
    .then(([restaurantsRes, tablesRes]) => {
      // Find the specific restaurant by ID from the list
      const foundRestaurant = restaurantsRes.data.find(
        (rest) => rest.restaurant_id === id
      );
      
      if (!foundRestaurant) {
        setError("Restaurant not found");
        setLoading(false);
        return;
      }
      
      setRestaurant(foundRestaurant);
      setTables(tablesRes.data);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Error fetching data:", err);
      setError("Failed to load reservation data");
      setLoading(false);
    });
  }, [restaurant_id, currentUser]);

  // Fetch reservations and update table availability when date/time/guests change or when refreshTrigger changes
  useEffect(() => {
    if (!formData.date || !formData.time || !tables.length) {
      setAvailableTables([]);
      setBookedTables([]);
      setExistingReservations([]);
      return;
    }

    // Fetch ALL reservations for this restaurant on this date
    axios.get(`${API_BASE_URL}/reservations?restaurant_id=${restaurant_id}`)
      .then((res) => {
        console.log("All reservations for this restaurant:", res.data);
        
        // Filter reservations that would conflict with the selected time
        const reservations = res.data.filter(r => {
          // Skip cancelled reservations
          if (r.status === 2) return false;
          
          // Must be same date (accounting for possible time zone differences in date format)
          if (!r.date || !r.date.startsWith(formData.date)) return false;
          
          // Must have both time values
          if (!r.time) return false;
          
          // Check for time overlap
          return checkTimeOverlap(formData.time, r.time);
        });
        
        console.log("Conflicting reservations:", reservations);
        setExistingReservations(reservations);
        
        // Get table_ids that are already reserved at this time
        // Filter out null table_id values
        const reservedTableIds = reservations
          .filter(r => r.table_id !== null)
          .map(r => r.table_id);
          
        console.log("Reserved table IDs:", reservedTableIds);
        
        // Split tables into available and booked based on reservations
        if (tables.length > 0) {
          // Tables that are already booked
          const booked = tables.filter(table => 
            reservedTableIds.includes(table.table_no)
          );
          
          // Tables that are available and meet capacity requirements
          const available = tables.filter(table => 
            !reservedTableIds.includes(table.table_no) && 
            table.capacity >= formData.guests &&
            table.is_available
          );
          
          console.log("Available tables:", available);
          console.log("Booked tables:", booked);
          
          setAvailableTables(available);
          setBookedTables(booked);
        }
      })
      .catch(err => {
        console.error("Error checking table availability:", err);
        setError("Failed to check table availability");
      });
  }, [formData.date, formData.time, formData.guests, tables, restaurant_id, refreshTrigger]);

  // Function to refresh reservation data
  const refreshReservations = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev, 
      [name]: name === "guests" ? parseInt(value, 10) : value,
      // Reset table selection when date or time changes
      ...(name === 'date' || name === 'time' ? { table_id: null } : {})
    }));
  };

  const handleTableSelect = (table_no) => {
    // First do a fresh check to make sure the table is still available
    refreshReservations();
    
    // Check if the table is already booked for this time
    const tableConflicts = existingReservations.filter(r => 
      r.table_id === table_no || r.table_no === table_no
    );
    
    if (tableConflicts.length > 0) {
      setError("This table is already booked for the selected time.");
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      table_id: parseInt(table_no, 10) // Store as table_id (not table_no)
    }));
    
    // Clear any previous error message
    setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Double-check user is logged in
    if (!currentUser) {
      setError("You must be logged in to make a reservation");
      return;
    }
    
    if (!formData.date || !formData.time || !formData.table_id) {
      setError("Please fill in all required fields");
      return;
    }
    
    // Force a refresh of reservations data before submitting
    axios.get(`${API_BASE_URL}/reservations?restaurant_id=${restaurant_id}`)
      .then((res) => {
        // Filter to find conflicts just for our selected table and time
        const conflicts = res.data.filter(r => {
          // Skip if this reservation doesn't have a table_id value
          if (r.table_id === null) return false;
          
          return r.status !== 2 && // Not cancelled
                 r.date.startsWith(formData.date) && // Same date
                 (r.table_id === formData.table_id || r.table_no === formData.table_id) && // Same table
                 checkTimeOverlap(formData.time, r.time); // Time overlap
        });
        
        if (conflicts.length > 0) {
          setError("This table is already booked during your selected time. Please select a different table or time.");
          console.log("Conflicting reservations for this table:", conflicts);
          refreshReservations();
          return;
        }
        
        // No conflicts, proceed with booking
        const payload = {
          user_id: parseInt(currentUser.user_id, 10),
          restaurant_id: parseInt(restaurant_id, 10),
          date: formData.date,
          time: formData.time,
          guests: parseInt(formData.guests, 10),
          status: parseInt(formData.status, 10),
          table_id: parseInt(formData.table_id, 10) // Send as table_id to match backend
        };

        console.log("Sending reservation data:", payload);
        setLoading(true);
        
        // Submit the reservation
        fetch(`${API_BASE_URL}/reservations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        })
        .then(response => {
          if (!response.ok) {
            return response.json().then(errData => {
              throw new Error(errData.error || `Server responded with status: ${response.status}`);
            });
          }
          return response.json();
        })
        .then(data => {
          // Check if the returned data has a null table_id
          if (data.table_id === null) {
            console.warn("Warning: The created reservation has a null table_id value", data);
          }
          
          setReservationStatus({
            success: true,
            message: `Your booking is confirmed for ${formData.date} from ${formData.time} to ${endTime}`,
            data: data
          });
          setLoading(false);
        })
        .catch(err => {
          console.error("Error making reservation:", err);
          
          let errorMessage = "Failed to make reservation. Please try again.";
          
          // Handle specific errors
          if (err.message.includes("already reserved") || err.message.includes("table is not available")) {
            errorMessage = "This table has just been booked by another user. Please select a different table.";
            refreshReservations();
          } else {
            errorMessage = err.message || "Failed to make reservation. Please try again.";
          }
          
          setReservationStatus({
            success: false,
            message: errorMessage
          });
          setLoading(false);
        });
      })
      .catch(err => {
        console.error("Error checking for conflicts:", err);
        setError("Failed to verify table availability. Please try again.");
      });
  };

  const handleCloseConfirmation = () => {
    if (reservationStatus?.success) {
      navigate(`/restaurant/${restaurant_id}`);
    } else {
      setReservationStatus(null);
    }
  };

  if (loading && !error) return <div className="loading">Loading reservation system...</div>;
  
  return (
    <div className="reservation-container">
      {error ? (
        <div className="error-container">
          <div className="error">{error}</div>
          <button 
            className="return-button" 
            onClick={() => navigate(`/restaurant/${restaurant_id}`)}
          >
            Return to Restaurant
          </button>
        </div>
      ) : reservationStatus ? (
        <div className="reservation-confirmation">
          <div className="confirmation-content">
            <h2>{reservationStatus.success ? "Success!" : "Error"}</h2>
            <p>{reservationStatus.message}</p>
            <button className="confirm-button" onClick={handleCloseConfirmation}>Okay</button>
          </div>
        </div>
      ) : (
        currentUser && (
          <>
            {restaurant && (
              <div className="restaurant-header-section">
                <h1>{restaurant.name}</h1>
                <p className="restaurant-location">{restaurant.location}</p>
              </div>
            )}
            
            <div className="reservation-form-container">
              <h2>Reservation</h2>
              <div className="user-info">
                <p>Booking as: <strong>{currentUser.name}</strong></p>
              </div>
              <form onSubmit={handleSubmit} className="reservation-form">
                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input 
                    type="date" 
                    id="date" 
                    name="date" 
                    value={formData.date} 
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="time">Start Time</label>
                  <input 
                    type="time" 
                    id="time" 
                    name="time" 
                    value={formData.time} 
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                {endTime && (
                  <div className="form-group end-time">
                    <label>End Time</label>
                    <div className="end-time-display">{endTime}</div>
                    <div className="time-info">(1 hour reservation)</div>
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="guests">Number of guests</label>
                  <input 
                    type="number" 
                    id="guests" 
                    name="guests" 
                    value={formData.guests} 
                    onChange={handleInputChange}
                    min="1"
                    max="20"
                    required
                  />
                </div>
                
                {(availableTables.length > 0 || bookedTables.length > 0) && (
                  <div className="tables-section">
                    <div className="tables-legend">
                      <div className="legend-item">
                        <span className="legend-color available"></span>
                        <span>Available</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color booked"></span>
                        <span>Booked</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color selected"></span>
                        <span>Selected</span>
                      </div>
                    </div>
                    
                    <label>Tables</label>
                    <div className="tables-grid">
                      {/* Available Tables */}
                      {availableTables.map(table => (
                        <div 
                          key={`available-${table.table_no}`}
                          className={`table-option available ${formData.table_id === table.table_no ? 'selected' : ''}`}
                          onClick={() => handleTableSelect(table.table_no)}
                        >
                          <span className="table-number">Table {table.table_no}</span>
                          <span className="table-capacity">Seats {table.capacity}</span>
                          <span className="table-type">{table.type || 'Standard'}</span>
                        </div>
                      ))}
                      
                      {/* Booked Tables */}
                      {bookedTables.map(table => (
                        <div 
                          key={`booked-${table.table_no}`}
                          className="table-option booked"
                          onClick={() => setError("This table is already booked for the selected time.")}
                        >
                          <span className="table-number">Table {table.table_no}</span>
                          <span className="table-capacity">Seats {table.capacity}</span>
                          <span className="table-type">{table.type || 'Standard'}</span>
                          <div className="booked-label">Booked</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {formData.date && formData.time && formData.guests && availableTables.length === 0 && bookedTables.length === 0 && (
                  <div className="no-tables-message">
                    No tables available for the selected date, time, and party size.
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="confirm-booking-button"
                  disabled={!formData.date || !formData.time || !formData.table_id}
                >
                  Confirm Booking
                </button>
              </form>
            </div>
          </>
        )
      )}
    </div>
  );
};

export default Reservation;