const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// GET all restaurants
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Restaurants");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET restaurant by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM Restaurants WHERE restaurant_id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Restaurant not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new restaurant
router.post("/", async (req, res) => {
  try {
    const { name, location, rating, opening_hours } = req.body;
    const result = await pool.query(
      "INSERT INTO Restaurants (name, location, rating, opening_hours) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, location, rating, opening_hours]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update restaurant
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, rating, opening_hours } = req.body;
    const result = await pool.query(
      "UPDATE Restaurants SET name = $1, location = $2, rating = $3, opening_hours = $4 WHERE restaurant_id = $5 RETURNING *",
      [name, location, rating, opening_hours, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Restaurant not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE restaurant
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM Restaurants WHERE restaurant_id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Restaurant not found" });
    res.json({ message: "Restaurant deleted", restaurant: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
