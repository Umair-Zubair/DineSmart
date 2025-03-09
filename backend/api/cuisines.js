const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// GET all cuisines
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Cuisines");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET cuisine by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM Cuisines WHERE cuisine_id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Cuisine not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new cuisine
router.post("/", async (req, res) => {
  try {
    const { cuisine_name } = req.body;
    const result = await pool.query(
      "INSERT INTO Cuisines (cuisine_name) VALUES ($1) RETURNING *",
      [cuisine_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update cuisine
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { cuisine_name } = req.body;
    const result = await pool.query(
      "UPDATE Cuisines SET cuisine_name = $1 WHERE cuisine_id = $2 RETURNING *",
      [cuisine_name, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Cuisine not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE cuisine
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM Cuisines WHERE cuisine_id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Cuisine not found" });
    res.json({ message: "Cuisine deleted", cuisine: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
