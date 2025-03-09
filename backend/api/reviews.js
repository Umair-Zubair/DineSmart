const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// GET all reviews (optionally filter by restaurant_id or user_id)
router.get("/", async (req, res) => {
  try {
    let query = "SELECT * FROM Reviews";
    const params = [];
    if (req.query.restaurant_id) {
      query += " WHERE restaurant_id = $1";
      params.push(req.query.restaurant_id);
    } else if (req.query.user_id) {
      query += " WHERE user_id = $1";
      params.push(req.query.user_id);
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET review by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM Reviews WHERE review_id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Review not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new review
router.post("/", async (req, res) => {
  try {
    const { user_id, restaurant_id, rating, comment } = req.body;
    const result = await pool.query(
      "INSERT INTO Reviews (user_id, restaurant_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *",
      [user_id, restaurant_id, rating, comment]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update review
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, restaurant_id, rating, comment } = req.body;
    const result = await pool.query(
      "UPDATE Reviews SET user_id = $1, restaurant_id = $2, rating = $3, comment = $4 WHERE review_id = $5 RETURNING *",
      [user_id, restaurant_id, rating, comment, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Review not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE review
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM Reviews WHERE review_id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Review not found" });
    res.json({ message: "Review deleted", review: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
