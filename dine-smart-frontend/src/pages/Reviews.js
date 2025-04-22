import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../cssfiles/Reviews.css';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [userReservations, setUserReservations] = useState([]);
    const [pendingReviews, setPendingReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newReview, setNewReview] = useState({
        restaurant_id: '',
        rating: 5,
        comment: ''
    });
    const [user, setUser] = useState(null);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [debug, setDebug] = useState({});

    // Base API URL
    const API_BASE_URL = "https://dinesmart-backend.vercel.app";

    useEffect(() => {
        const loggedInUser = localStorage.getItem('user');
        if (loggedInUser) {
            setUser(JSON.parse(loggedInUser));
        }
        
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const debugInfo = {};
        try {
            // Fetch all reviews
            const reviewsResponse = await fetch(`${API_BASE_URL}/reviews`);
            const reviewsData = await reviewsResponse.json();
            setReviews(reviewsData);
            debugInfo.reviews = reviewsData;

            // Fetch all restaurants
            const restaurantsResponse = await fetch(`${API_BASE_URL}/restaurants`);
            const restaurantsData = await restaurantsResponse.json();
            setRestaurants(restaurantsData);
            debugInfo.restaurants = restaurantsData;

            // Fetch all reservations
            const reservationsResponse = await fetch(`${API_BASE_URL}/reservations`);
            const reservationsData = await reservationsResponse.json();
            setReservations(reservationsData);
            debugInfo.allReservations = reservationsData;

            // If user is logged in, filter reservations for this user
            const loggedInUser = localStorage.getItem('user');
            if (loggedInUser) {
                const userData = JSON.parse(loggedInUser);
                debugInfo.currentUser = userData;
                
                // Filter reservations for this user
                const userReservs = reservationsData.filter(res => 
                    Number(res.user_id) === Number(userData.user_id)
                );
                setUserReservations(userReservs);
                debugInfo.userReservations = userReservs;
                
                // Determine which reservations are eligible for review
                // A reservation is eligible if:
                // 1. It's a past date, OR
                // 2. It's today but the end_time has passed
                const now = new Date();
                debugInfo.currentDate = now.toString();
                
                const pastReservations = userReservs.filter(res => {
                    // Create date objects for comparison
                    const reservationDate = new Date(res.date);
                    const reservationDateTime = new Date(res.date.split('T')[0] + 'T' + res.end_time);
                    
                    // For debug
                    debugInfo.reservationDate = reservationDate.toString();
                    debugInfo.reservationEndTime = reservationDateTime.toString();
                    
                    // Check if date is in the past
                    const dateInPast = reservationDate < now;
                    
                    // Check if it's today and time has passed
                    const isToday = reservationDate.toDateString() === now.toDateString();
                    const timeHasPassed = reservationDateTime < now;
                    
                    // Reservation is eligible for review if date is in past OR (it's today AND end time has passed)
                    return dateInPast || (isToday && timeHasPassed);
                });
                
                debugInfo.pastReservations = pastReservations;
                
                // Check which eligible reservations don't have reviews yet
                const pendingReviewsList = pastReservations.filter(res => {
                    const hasNoReview = !reviewsData.some(review => 
                        Number(review.user_id) === Number(userData.user_id) && 
                        Number(review.restaurant_id) === Number(res.restaurant_id)
                    );
                    return hasNoReview;
                });
                
                setPendingReviews(pendingReviewsList);
                debugInfo.pendingReviews = pendingReviewsList;
            }
            
            setDebug(debugInfo);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load data. Please try again later.');
            debugInfo.error = error.message;
        } finally {
            setLoading(false);
        }
    };

    const handleReviewChange = (e) => {
        const { name, value } = e.target;
        setNewReview(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRatingChange = (rating) => {
        setNewReview(prev => ({
            ...prev,
            rating
        }));
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        
        if (!user) {
            setError("Please log in to submit a review");
            return;
        }
        
        if (!newReview.restaurant_id || !newReview.comment) {
            setError("Please select a restaurant and write a comment");
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.user_id,
                    restaurant_id: newReview.restaurant_id,
                    rating: newReview.rating,
                    comment: newReview.comment
                }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit review');
            }
            
            // Reset form and refresh data
            setNewReview({
                restaurant_id: '',
                rating: 5,
                comment: ''
            });
            setReviewSubmitted(true);
            setError('');
            
            // Refresh the data
            fetchData();
            
            setTimeout(() => {
                setReviewSubmitted(false);
            }, 3000);
            
        } catch (error) {
            console.error('Error submitting review:', error);
            setError('Failed to submit review. Please try again.');
        }
    };

    // Get restaurant name by ID
    const getRestaurantName = (id) => {
        const restaurant = restaurants.find(r => Number(r.restaurant_id) === Number(id));
        return restaurant ? restaurant.name : 'Unknown Restaurant';
    };

    // Get user name by ID
    const getUserName = (id) => {
        // If it's the current user
        if (user && Number(user.user_id) === Number(id)) {
            return user.name;
        }
        return `User #${id}`;
    };

    // Format date for display
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading) {
        return <div className="loading">Loading reviews...</div>;
    }

    return (
        <div className="reviews-page">
            <div className="reviews-container">
                <h1>Restaurant Reviews</h1>
                
                {error && <div className="error-message">{error}</div>}
                
                {/* Debug Information - Remove in Production */}
                {/* <div className="debug-section" style={{background: '#f8f8f8', padding: '20px', margin: '20px 0', border: '1px solid #ddd', borderRadius: '4px'}}>
                    <h4>Debug Information (Remove in Production)</h4>
                    <p>User logged in: {user ? 'Yes' : 'No'}</p>
                    {user && <p>User ID: {user.user_id}, Name: {user.name}</p>}
                    <p>Total Reservations: {reservations.length}</p>
                    <p>User Reservations: {userReservations.length}</p>
                    <p>Pending Reviews: {pendingReviews.length}</p>
                    
                    <details>
                        <summary>User Reservations Details</summary>
                        <pre>{JSON.stringify(userReservations, null, 2)}</pre>
                    </details>
                    
                    <details>
                        <summary>All Debug Data</summary>
                        <pre>{JSON.stringify(debug, null, 2)}</pre>
                    </details>
                </div> */}
                
                {user && pendingReviews.length > 0 && (
                    <div className="pending-reviews-section">
                        <h2>Reviews to Write</h2>
                        <p>You have {pendingReviews.length} past visits to review</p>
                        
                        <form className="review-form" onSubmit={handleSubmitReview}>
                            <div className="form-group">
                                <label>Select Restaurant to Review:</label>
                                <select 
                                    name="restaurant_id" 
                                    value={newReview.restaurant_id}
                                    onChange={handleReviewChange}
                                    required
                                >
                                    <option value="">Select a restaurant</option>
                                    {pendingReviews.map(reservation => (
                                        <option 
                                            key={`${reservation.reservation_id}-${reservation.restaurant_id}`} 
                                            value={reservation.restaurant_id}
                                        >
                                            {getRestaurantName(reservation.restaurant_id)} - Visited on {formatDate(reservation.date)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Your Rating:</label>
                                <div className="star-rating">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <span 
                                            key={star}
                                            className={`star ${star <= newReview.rating ? 'filled' : ''}`}
                                            onClick={() => handleRatingChange(star)}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Your Review:</label>
                                <textarea
                                    name="comment"
                                    value={newReview.comment}
                                    onChange={handleReviewChange}
                                    required
                                    placeholder="Share your experience with this restaurant..."
                                    rows="4"
                                ></textarea>
                            </div>
                            
                            <button type="submit" className="submit-review-btn">Submit Review</button>
                            
                            {reviewSubmitted && (
                                <div className="success-message">Your review has been submitted successfully!</div>
                            )}
                        </form>
                    </div>
                )}
                
                <div className="all-reviews-section">
                    <h2>All Reviews</h2>
                    
                    {restaurants.map(restaurant => {
                        // Get reviews for this restaurant
                        const restaurantReviews = reviews.filter(r => 
                            Number(r.restaurant_id) === Number(restaurant.restaurant_id)
                        );
                        
                        if (restaurantReviews.length === 0) {
                            return null; // Skip restaurants with no reviews
                        }
                        
                        // Calculate average rating
                        const averageRating = restaurantReviews.reduce((acc, review) => acc + review.rating, 0) / restaurantReviews.length;
                        
                        return (
                            <div key={restaurant.restaurant_id} className="restaurant-reviews">
                                <div className="restaurant-header">
                                    <h3>
                                        <Link to={`/restaurant/${restaurant.restaurant_id}`}>
                                            {restaurant.name}
                                        </Link>
                                    </h3>
                                    <div className="restaurant-rating">
                                        <span className="stars">
                                            {Array(5).fill(0).map((_, i) => (
                                                <span key={i} className={`star ${i < Math.round(averageRating) ? 'filled' : ''}`}>★</span>
                                            ))}
                                        </span>
                                        <span className="rating-value">
                                            {averageRating.toFixed(1)}
                                        </span>
                                        <span className="review-count">
                                            ({restaurantReviews.length} reviews)
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="reviews-list">
                                    {restaurantReviews.map(review => (
                                        <div key={review.review_id} className="review-item">
                                            <div className="review-header">
                                                <div className="reviewer-info">
                                                    <span className="reviewer-name">{getUserName(review.user_id)}</span>
                                                    <span className="review-date">{new Date(review.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="review-rating">
                                                    {Array(5).fill(0).map((_, i) => (
                                                        <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`}>★</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="review-content">
                                                {review.comment}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    
                    {reviews.length === 0 && (
                        <div className="no-reviews">
                            <p>No reviews yet. Be the first to review a restaurant!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reviews;