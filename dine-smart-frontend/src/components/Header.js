import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../cssfiles/Header.css'; 
const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
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
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/restaurants" className="nav-link">Restaurants</Link>
                    <Link to="/about" className="nav-link">About</Link>
                    <Link to="/contact" className="nav-link">Contact</Link>
                </nav>

                <div className="header-actions">
                    <Link to="/login" className="login-btn">Login</Link>
                    <Link to="/signup" className="signup-btn">Sign Up</Link>
                </div>

                <div className="mobile-menu-toggle" onClick={toggleMenu}>
                    <span className={`bar ${isMenuOpen ? 'change' : ''}`}></span>
                    <span className={`bar ${isMenuOpen ? 'change' : ''}`}></span>
                    <span className={`bar ${isMenuOpen ? 'change' : ''}`}></span>
                </div>
            </div>
        </header>
    );
};

export default Header;