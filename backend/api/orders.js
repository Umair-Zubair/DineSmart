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
    let query = "SELECT * FROM Orders";
    const params = [];
    if (req.query.user_id) {
      query += " WHERE user_id = $1";
      params.push(req.query.user_id);
    } else if (req.query.restaurant_id) {
      query += " WHERE restaurant_id = $1";
      params.push(req.query.restaurant_id);
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET order by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM Orders WHERE order_id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Order not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new order
router.post("/", async (req, res) => {
  try {
    const { user_id, restaurant_id, order_status, reservation_id } = req.body;
    const result = await pool.query(
      "INSERT INTO Orders (user_id, restaurant_id, order_status, reservation_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [user_id, restaurant_id, order_status, reservation_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    if (result.rows.length === 0) return res.status(404).json({ error: "Order not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE order
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM Orders WHERE order_id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted", order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
