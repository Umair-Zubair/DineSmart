import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../cssfiles/AdminDashboard.css';

const AdminDashboard = () => {
    // State variables
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    
    // Data states
    const [restaurants, setRestaurants] = useState([]);
    const [users, setUsers] = useState([]);
    const [totalRestaurants, setTotalRestaurants] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    
    // Form states
    const [showAddRestaurantForm, setShowAddRestaurantForm] = useState(false);
    const [newRestaurantData, setNewRestaurantData] = useState({
        name: '',
        location: '',
        cuisine: '',
        image_url: ''
    });
    
    const navigate = useNavigate();
    const API_BASE_URL = "https://dinesmart-backend.vercel.app";

    // Check if user is logged in and is an admin
    useEffect(() => {
        const checkAdmin = () => {
            const loggedInUser = localStorage.getItem('user');
            if (loggedInUser) {
                const userData = JSON.parse(loggedInUser);
                if (userData.role === 0) { // 0 = admin role
                    setUser(userData);
                    setLoading(false);
                } else {
                    // Not an admin, redirect to home
                    setError("You don't have permission to access this page");
                    setTimeout(() => navigate('/'), 2000);
                }
            } else {
                // Not logged in, redirect to home
                setError("Please log in to access this page");
                setTimeout(() => navigate('/'), 2000);
            }
        };
        
        checkAdmin();
    }, [navigate]);

    // Fetch data
    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    // Fetch all data
    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch restaurants
            const restResponse = await fetch(`${API_BASE_URL}/restaurants`);
            const restData = await restResponse.json();
            setRestaurants(restData);
            setTotalRestaurants(restData.length);
            
            // Fetch users
            const usersResponse = await fetch(`${API_BASE_URL}/users`);
            const usersData = await usersResponse.json();
            setUsers(usersData);
            setTotalUsers(usersData.length);
            
            setLoading(false);
        } catch (err) {
            console.error("Error loading data:", err);
            setError("Failed to load data");
            setLoading(false);
        }
    };

    // Handle input change for restaurant form
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewRestaurantData({
            ...newRestaurantData,
            [name]: value
        });
    };

    // Add new restaurant
    const handleAddRestaurant = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/restaurants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newRestaurantData.name,
                    location: newRestaurantData.location,
                    rating: 0,
                    opening_hours: "10:00-22:00",
                    image_url: newRestaurantData.image_url
                }),
            });
            
            if (!response.ok) throw new Error('Failed to add restaurant');
            
            // Reset form and refetch data
            setNewRestaurantData({
                name: '',
                location: '',
                cuisine: '',
                image_url: ''
            });
            setShowAddRestaurantForm(false);
            fetchData();
            
        } catch (err) {
            console.error("Error adding restaurant:", err);
            setError("Failed to add restaurant");
        }
    };

    // Function to handle restaurant deletion
    const handleDeleteRestaurant = async (restaurantId) => {
        if (window.confirm('Are you sure you want to delete this restaurant?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) throw new Error('Failed to delete restaurant');
                
                // Refresh data
                fetchData();
            } catch (err) {
                console.error("Error deleting restaurant:", err);
                setError("Failed to delete restaurant");
            }
        }
    };

    // Function to handle user deletion
    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) throw new Error('Failed to delete user');
                
                // Refresh data
                fetchData();
            } catch (err) {
                console.error("Error deleting user:", err);
                setError("Failed to delete user");
            }
        }
    };

    // Show loading state
    if (loading) {
        return <div className="admin-loading">Loading dashboard...</div>;
    }

    // Show error
    if (error) {
        return <div className="admin-error">{error}</div>;
    }

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            
            {/* Navigation Tabs */}
            <div className="admin-navigation">
                <button 
                    className={activeTab === 'overview' ? 'active' : ''} 
                    onClick={() => setActiveTab('overview')}
                >
                    Dashboard
                </button>
                <button 
                    className={activeTab === 'users' ? 'active' : ''} 
                    onClick={() => setActiveTab('users')}
                >
                    View Users
                </button>
                <button 
                    className={activeTab === 'restaurants' ? 'active' : ''} 
                    onClick={() => setActiveTab('restaurants')}
                >
                    View/Manage Restaurants
                </button>
            </div>
            
            {/* Dashboard Overview */}
            {activeTab === 'overview' && (
                <div className="admin-overview">
                    <div className="stats-container">
                        <div className="stat-box">
                            <h3>Total Users</h3>
                            <p className="stat-value">{totalUsers}</p>
                        </div>
                        <div className="stat-box">
                            <h3>Total Restaurants</h3>
                            <p className="stat-value">{totalRestaurants}</p>
                        </div>
                    </div>
                    
                    <div className="performance-analytics">
                        <h2>Performance Analytics</h2>
                        <div className="chart-container">
                            <div className="placeholder-chart">
                                <div className="bar-chart">
                                    <div className="bar" style={{height: '60%'}}><span>Jan</span></div>
                                    <div className="bar" style={{height: '80%'}}><span>Feb</span></div>
                                    <div className="bar" style={{height: '45%'}}><span>Mar</span></div>
                                    <div className="bar" style={{height: '70%'}}><span>Apr</span></div>
                                    <div className="bar" style={{height: '90%'}}><span>May</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Users Section */}
            {activeTab === 'users' && (
                <div className="admin-users">
                    <h2>All Users</h2>
                    <div className="users-list">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.user_id}>
                                        <td>{user.user_id}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            {user.role === 0 ? 'Admin' : 
                                             user.role === 1 ? 'Owner' : 'Customer'}
                                        </td>
                                        <td>
                                            <button 
                                                className="delete-btn"
                                                onClick={() => handleDeleteUser(user.user_id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Restaurants Section */}
            {activeTab === 'restaurants' && (
                <div className="admin-restaurants">
                    <div className="section-header">
                        <h2>All Restaurants</h2>
                        <button 
                            className="add-restaurant-btn"
                            onClick={() => setShowAddRestaurantForm(true)}
                        >
                            Add New Restaurant
                        </button>
                    </div>
                    
                    {showAddRestaurantForm && (
                        <div className="form-overlay">
                            <div className="add-restaurant-form">
                                <h3>New Restaurant</h3>
                                <button 
                                    className="close-form-btn"
                                    onClick={() => setShowAddRestaurantForm(false)}
                                >
                                    &times;
                                </button>
                                <form onSubmit={handleAddRestaurant}>
                                    <div className="form-group">
                                        <label>Restaurant Name</label>
                                        <input 
                                            type="text" 
                                            name="name" 
                                            value={newRestaurantData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Location</label>
                                        <input 
                                            type="text" 
                                            name="location" 
                                            value={newRestaurantData.location}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Cuisine(s)</label>
                                        <input 
                                            type="text" 
                                            name="cuisine" 
                                            value={newRestaurantData.cuisine}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Image URL</label>
                                        <input 
                                            type="text" 
                                            name="image_url" 
                                            value={newRestaurantData.image_url}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <button type="submit" className="submit-btn">Add</button>
                                </form>
                            </div>
                        </div>
                    )}
                    
                    <div className="restaurants-list">
                        {restaurants.map(restaurant => (
                            <div className="restaurant-card" key={restaurant.restaurant_id}>
                                <div className="restaurant-info">
                                    <h3>{restaurant.name}</h3>
                                    <p>{restaurant.rating} ★</p>
                                </div>
                                <div className="restaurant-actions">
                                    <button className="edit-btn">Edit Info</button>
                                    <button 
                                        className="delete-btn"
                                        onClick={() => handleDeleteRestaurant(restaurant.restaurant_id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;