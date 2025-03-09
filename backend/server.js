const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();
require("./database");

const app = express();
const port = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Neon.tech
});

// Middleware
app.use(cors());
app.use(express.json());

// Import API modules
const usersAPI = require("./api/users");
const restaurantsAPI = require("./api/restaurants");
const menuItemsAPI = require("./api/menu-items");
const reservationsAPI = require("./api/reservations");
const ordersAPI = require("./api/orders");
const orderItemsAPI = require("./api/order-items");
const reviewsAPI = require("./api/reviews");
const restaurantCuisinesAPI = require("./api/restaurant_cuisines");
const tablesAPI = require("./api/tables");
const cuisinesAPI = require("./api/cuisines");


// Routes
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Restaurant Management API</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          margin-top: 50px;
        }
        .button {
          display: inline-block;
          margin: 10px;
          padding: 15px 25px;
          font-size: 16px;
          color: #fff;
          background-color: #007BFF;
          border: none;
          border-radius: 5px;
          text-decoration: none;
          cursor: pointer;
        }
        .button:hover {
          background-color: #0056b3;
        }
        .container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 1200px;
          margin: 0 auto;
        }
      </style>
    </head>
    <body>
      <h1>Restaurant Management API</h1>
      <p>Click on a button to access an API endpoint:</p>
      <div class="container">
        <a href="/users" class="button">Users</a>
        <a href="/restaurants" class="button">Restaurants</a>
        <a href="/menu-items" class="button">Menu Items</a>
        <a href="/reservations" class="button">Reservations</a>
        <a href="/orders" class="button">Orders</a>
        <a href="/order-items" class="button">Order Items</a>
        <a href="/reviews" class="button">Reviews</a>
        <a href="/restaurant-cuisines" class="button">Restaurant Cuisines</a>
        <a href="/tables" class="button">Tables</a>
        <a href="/cuisines" class="button">Cuisines</a>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});
// Users
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restaurants
app.get("/restaurants", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Restaurants");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Menu Items
app.get("/menu-items/:restaurant_id", async (req, res) => {
  try {
    const { restaurant_id } = req.params;
    const result = await pool.query("SELECT * FROM MenuItems WHERE restaurant_id = $1", [restaurant_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reservations
app.get("/reservations/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await pool.query("SELECT * FROM Reservations WHERE user_id = $1", [user_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Orders
app.get("/orders/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await pool.query("SELECT * FROM Orders WHERE user_id = $1", [user_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Order Items
app.get("/order-items/:order_id", async (req, res) => {
  try {
    const { order_id } = req.params;
    const result = await pool.query("SELECT * FROM OrderItems WHERE order_id = $1", [order_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reviews
app.get("/reviews/:restaurant_id", async (req, res) => {
  try {
    const { restaurant_id } = req.params;
    const result = await pool.query("SELECT * FROM Reviews WHERE restaurant_id = $1", [restaurant_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restaurant Cuisines
app.get("/restaurant-cuisines/:restaurant_id", async (req, res) => {
  try {
    const { restaurant_id } = req.params;
    const result = await pool.query("SELECT * FROM Restaurant_Cuisines WHERE restaurant_id = $1", [restaurant_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tables
app.get("/tables/:restaurant_id", async (req, res) => {
  try {
    const { restaurant_id } = req.params;
    const result = await pool.query("SELECT * FROM Tables WHERE restaurant_id = $1", [restaurant_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cuisines
app.get("/cuisines", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Cuisines");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
