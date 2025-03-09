const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// GET all order items for a given order (order_id is required as a query parameter)
router.get("/", async (req, res) => {
  try {
    if (!req.query.order_id) {
      return res.status(400).json({ error: "order_id query parameter is required" });
    }
    const result = await pool.query("SELECT * FROM OrderItems WHERE order_id = $1", [req.query.order_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET order item by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM OrderItems WHERE order_item_id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Order item not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new order item
router.post("/", async (req, res) => {
  try {
    const { order_id, item_id, quantity } = req.body;
    const result = await pool.query(
      "INSERT INTO OrderItems (order_id, item_id, quantity) VALUES ($1, $2, $3) RETURNING *",
      [order_id, item_id, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update order item
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { order_id, item_id, quantity } = req.body;
    const result = await pool.query(
      "UPDATE OrderItems SET order_id = $1, item_id = $2, quantity = $3 WHERE order_item_id = $4 RETURNING *",
      [order_id, item_id, quantity, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Order item not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE order item
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM OrderItems WHERE order_item_id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Order item not found" });
    res.json({ message: "Order item deleted", order_item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
