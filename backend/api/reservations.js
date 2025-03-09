const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// GET all reservations (optionally filter by user_id or restaurant_id)
router.get("/", async (req, res) => {
  try {
    let query = "SELECT * FROM Reservations";
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

// GET reservation by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM Reservations WHERE reservation_id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Reservation not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new reservation
router.post("/", async (req, res) => {
  try {
    const { user_id, restaurant_id, date, time, guests, status } = req.body;
    const result = await pool.query(
      "INSERT INTO Reservations (user_id, restaurant_id, date, time, guests, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [user_id, restaurant_id, date, time, guests, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update reservation
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, restaurant_id, date, time, guests, status } = req.body;
    const result = await pool.query(
      "UPDATE Reservations SET user_id = $1, restaurant_id = $2, date = $3, time = $4, guests = $5, status = $6 WHERE reservation_id = $7 RETURNING *",
      [user_id, restaurant_id, date, time, guests, status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Reservation not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE reservation
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM Reservations WHERE reservation_id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Reservation not found" });
    res.json({ message: "Reservation deleted", reservation: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
