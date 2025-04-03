const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// GET all tables for a restaurant
router.get("/:restaurant_id", async (req, res) => {
  try {
    const { restaurant_id } = req.params;
    const result = await pool.query("SELECT * FROM Tables WHERE restaurant_id = $1", [restaurant_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET table by table_no and restaurant_id
router.get("/:table_no/:restaurant_id", async (req, res) => {
  try {
    const { table_no, restaurant_id } = req.params;
    const result = await pool.query("SELECT * FROM Tables WHERE table_no = $1 AND restaurant_id = $2", [table_no, restaurant_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Table not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new table
router.post("/", async (req, res) => {
  try {
    const { restaurant_id, capacity, type } = req.body;
    const result = await pool.query(
      "INSERT INTO Tables (restaurant_id, capacity, type) VALUES ($1, $2, $3) RETURNING *",
      [restaurant_id, capacity, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update table
router.put("/:table_no/:restaurant_id", async (req, res) => {
  try {
    const { table_no, restaurant_id } = req.params;
    const { capacity, is_available, type } = req.body;
    const result = await pool.query(
      "UPDATE Tables SET capacity = $1, is_available = $2, type = $3 WHERE table_no = $4 AND restaurant_id = $5 RETURNING *",
      [capacity, is_available, type, table_no, restaurant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Table not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE table
router.delete("/:table_no/:restaurant_id", async (req, res) => {
  try {
    const { table_no, restaurant_id } = req.params;
    const result = await pool.query("DELETE FROM Tables WHERE table_no = $1 AND restaurant_id = $2 RETURNING *", [table_no, restaurant_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Table not found" });
    res.json({ message: "Table deleted", table: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
