import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../cssfiles/Header.css';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [showSignupPopup, setShowSignupPopup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [user, setUser] = useState(null);
    
    // Add React Router's navigation hook
    const navigate = useNavigate();
    
    // Base API URL
    const API_BASE_URL = "https://dinesmart-backend.vercel.app";

    // Check if user is already logged in
    useEffect(() => {
        const loggedInUser = localStorage.getItem('user');
        if (loggedInUser) {
            setUser(JSON.parse(loggedInUser));
        }
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const openLoginPopup = (e) => {
        e.preventDefault();
        setShowLoginPopup(true);
    };

    const openSignupPopup = (e) => {
        e.preventDefault();
        setShowSignupPopup(true);
    };

    const closePopups = () => {
        setShowLoginPopup(false);
        setShowSignupPopup(false);
        setErrorMessage('');
        setEmail('');
        setPassword('');
        setName('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        try {
            // Fetch all users to check for matching credentials
            const response = await fetch(`${API_BASE_URL}/users`);
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const users = await response.json();
            const matchedUser = users.find(user => 
                user.email === email && user.password_hash === password
            );

            if (matchedUser) {
                // Store user info in localStorage for persistence
                localStorage.setItem('user', JSON.stringify(matchedUser));
                setUser(matchedUser);
                closePopups();
                
                // Force reload the current page to refresh data
                navigate(0);
            } else {
                setErrorMessage('Invalid email or password');
            }
        } catch (error) {
            setErrorMessage('Login error: Unable to connect to server');
            console.error('Login error:', error);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!name || !email || !password) {
            setErrorMessage('All fields are required');
            return;
        }

        try {
            // Instead of using the users API route at the root level,
            // we need to use a POST endpoint that's set up correctly in the server
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password_hash: password,
                    role: 1, //default customer
                }),
            });

            if (!response.ok) {
                // Check if response is JSON or not
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to create account');
                } else {
                    throw new Error(`Server error: ${response.status}`);
                }
            }

            // Try to parse the JSON response, but handle potential errors
            let newUser;
            try {
                newUser = await response.json();
            } catch (jsonError) {
                throw new Error('Invalid response from server');
            }

            // If we get here, registration was successful
            localStorage.setItem('user', JSON.stringify(newUser));
            setUser(newUser);
            closePopups();
            
            // Force reload the current page to refresh data
            navigate(0);
        } catch (error) {
            setErrorMessage(`Signup failed: ${error.message}`);
            console.error('Signup error:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        
        // Force reload the current page to refresh data
        navigate(0);
    };

    return (
        <header className="dinesmart-header">
            <div className="header-container">
                <div className="logo-container">
                    <Link to="/" className="logo">
                        DineSmart
                    </Link>
                </div>

                <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                    <Link to="/" className="nav-link">Restaurants</Link>
                    <Link to="/preorder" className="nav-link">Pre-order</Link>
                    <Link to="/about" className="nav-link">About</Link>
                </nav>

                <div className="header-actions">
                    {user ? (
                        <div className="user-menu">
                            <span className="username">{user.name}</span>
                            <button className="logout-btn" onClick={handleLogout}>Logout</button>
                        </div>
                    ) : (
                        <>
                            <a href="/login" className="login-btn" onClick={openLoginPopup}>Login</a>
                            <a href="/signup" className="signup-btn" onClick={openSignupPopup}>Sign Up</a>
                        </>
                    )}
                </div>

                <div className="mobile-menu-toggle" onClick={toggleMenu}>
                    <span className={`bar ${isMenuOpen ? 'change' : ''}`}></span>
                    <span className={`bar ${isMenuOpen ? 'change' : ''}`}></span>
                    <span className={`bar ${isMenuOpen ? 'change' : ''}`}></span>
                </div>
            </div>

            {/* Login Popup */}
            {showLoginPopup && (
                <div className="popup-overlay" onClick={closePopups}>
                    <div className="popup-container" onClick={e => e.stopPropagation()}>
                        <button className="popup-close" onClick={closePopups}>&times;</button>
                        <h2>Login</h2>
                        {errorMessage && <div className="error-message">{errorMessage}</div>}
                        <form className="popup-form" onSubmit={handleLogin}>
                            <input
                                type="email"
                                className="popup-input"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                className="popup-input"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button type="submit" className="popup-submit">Login</button>
                        </form>
                        <div className="popup-switch">
                            Don't have an account? <span onClick={() => {
                                setShowLoginPopup(false);
                                setShowSignupPopup(true);
                            }}>Sign up</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Signup Popup */}
            {showSignupPopup && (
                <div className="popup-overlay" onClick={closePopups}>
                    <div className="popup-container" onClick={e => e.stopPropagation()}>
                        <button className="popup-close" onClick={closePopups}>&times;</button>
                        <h2>Sign Up</h2>
                        {errorMessage && <div className="error-message">{errorMessage}</div>}
                        <form className="popup-form" onSubmit={handleSignup}>
                            <input
                                type="text"
                                className="popup-input"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            <input
                                type="email"
                                className="popup-input"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                className="popup-input"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button type="submit" className="popup-submit">Sign Up</button>
                        </form>
                        <div className="popup-switch">
                            Already have an account? <span onClick={() => {
                                setShowSignupPopup(false);
                                setShowLoginPopup(true);
                            }}>Login</span>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;