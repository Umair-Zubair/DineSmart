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

// Use the imported API routers
app.use("/users", usersAPI);
app.use("/restaurants", restaurantsAPI);
app.use("/menu-items", menuItemsAPI);
app.use("/reservations", reservationsAPI);
app.use("/orders", ordersAPI);
app.use("/order-items", orderItemsAPI);
app.use("/reviews", reviewsAPI);
app.use("/restaurant-cuisines", restaurantCuisinesAPI);
app.use("/tables", tablesAPI);
app.use("/cuisines", cuisinesAPI);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});