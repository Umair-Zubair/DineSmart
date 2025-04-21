const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// GET all orders (optionally filter by user_id or restaurant_id)
router.get("/", async (req, res) => {
  try {
    let query = `
      SELECT o.*, 
             r.name as restaurant_name,
             res.date,
             res.time,
             res.guests
      FROM Orders o
      LEFT JOIN Restaurants r ON o.restaurant_id = r.restaurant_id
      LEFT JOIN Reservations res ON o.reservation_id = res.reservation_id
    `;
    
    const params = [];
    let whereClause = "";
    
    if (req.query.user_id) {
      whereClause = " WHERE o.user_id = $1";
      params.push(req.query.user_id);
    } else if (req.query.restaurant_id) {
      whereClause = " WHERE o.restaurant_id = $1";
      params.push(req.query.restaurant_id);
    }
    
    query += whereClause + " ORDER BY o.created_at DESC";
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET order by id with order items
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the order
    const orderQuery = `
      SELECT o.*, 
             r.name as restaurant_name,
             res.date,
             res.time,
             res.guests
      FROM Orders o
      LEFT JOIN Restaurants r ON o.restaurant_id = r.restaurant_id
      LEFT JOIN Reservations res ON o.reservation_id = res.reservation_id
      WHERE o.order_id = $1
    `;
    
    const orderResult = await pool.query(orderQuery, [id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    const order = orderResult.rows[0];
    
    // Get the order items
    const itemsQuery = `
      SELECT oi.*, mi.name, mi.description, mi.price, mi.image_url
      FROM OrderItems oi
      JOIN MenuItems mi ON oi.item_id = mi.item_id
      WHERE oi.order_id = $1
    `;
    
    const itemsResult = await pool.query(itemsQuery, [id]);
    
    // Calculate order total
    const total = itemsResult.rows.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);
    
    // Return order with items and total
    res.json({
      ...order,
      items: itemsResult.rows,
      total: total.toFixed(2)
    });
    
  } catch (err) {
    console.error("Error fetching order details:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST new order with transaction to handle order items
router.post("/", async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { user_id, restaurant_id, order_status, reservation_id, orderItems } = req.body;
    
    await client.query('BEGIN');
    
    // Insert the order
    const orderResult = await client.query(
      "INSERT INTO Orders (user_id, restaurant_id, order_status, reservation_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [user_id, restaurant_id, order_status, reservation_id]
    );
    
    const newOrder = orderResult.rows[0];
    
    // Insert order items if provided
    if (orderItems && Array.isArray(orderItems) && orderItems.length > 0) {
      const orderItemQueries = orderItems.map(item => {
        return client.query(
          "INSERT INTO OrderItems (order_id, item_id, quantity) VALUES ($1, $2, $3) RETURNING *",
          [newOrder.order_id, item.item_id, item.quantity]
        );
      });
      
      await Promise.all(orderItemQueries);
    }
    
    await client.query('COMMIT');
    
    res.status(201).json(newOrder);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error creating order:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT update order
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, restaurant_id, order_status, reservation_id } = req.body;
    
    const result = await pool.query(
      "UPDATE Orders SET user_id = $1, restaurant_id = $2, order_status = $3, reservation_id = $4 WHERE order_id = $5 RETURNING *",
      [user_id, restaurant_id, order_status, reservation_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json(result.rows[0]);
    
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE order with cascade to order items
router.delete("/:id", async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    // First delete associated order items (this can be handled by ON DELETE CASCADE in your schema)
    await client.query("DELETE FROM OrderItems WHERE order_id = $1", [id]);
    
    // Then delete the order
    const result = await client.query("DELETE FROM Orders WHERE order_id = $1 RETURNING *", [id]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Order not found" });
    }
    
    await client.query('COMMIT');
    
    res.json({ message: "Order deleted", order: result.rows[0] });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error deleting order:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;