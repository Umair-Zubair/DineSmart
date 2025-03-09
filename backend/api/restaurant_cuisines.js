const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// GET all restaurant cuisines (optionally filter by restaurant_id)
router.get("/", async (req, res) => {
  try {
    let query = "SELECT * FROM Restaurant_Cuisines";
    const params = [];
    if (req.query.restaurant_id) {
      query += " WHERE restaurant_id = $1";
      params.push(req.query.restaurant_id);
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a specific restaurant-cuisine record by restaurant_id and cuisine_id
router.get("/:restaurant_id/:cuisine_id", async (req, res) => {
  try {
    const { restaurant_id, cuisine_id } = req.params;
    const result = await pool.query(
      "SELECT * FROM Restaurant_Cuisines WHERE restaurant_id = $1 AND cuisine_id = $2",
      [restaurant_id, cuisine_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new restaurant cuisine record
router.post("/", async (req, res) => {
  try {
    const { restaurant_id, cuisine_id } = req.body;
    const result = await pool.query(
      "INSERT INTO Restaurant_Cuisines (restaurant_id, cuisine_id) VALUES ($1, $2) RETURNING *",
      [restaurant_id, cuisine_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE restaurant cuisine record
router.delete("/:restaurant_id/:cuisine_id", async (req, res) => {
  try {
    const { restaurant_id, cuisine_id } = req.params;
    const result = await pool.query(
      "DELETE FROM Restaurant_Cuisines WHERE restaurant_id = $1 AND cuisine_id = $2 RETURNING *",
      [restaurant_id, cuisine_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record deleted", record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
