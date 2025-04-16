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
    const result = await pool.query(
      `SELECT t.*, r.name as restaurant_name 
       FROM Tables t
       JOIN Restaurants r ON t.restaurant_id = r.restaurant_id
       WHERE t.restaurant_id = $1`, 
      [restaurant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET table by table_no and restaurant_id
router.get("/:table_no/:restaurant_id", async (req, res) => {
  try {
    const { table_no, restaurant_id } = req.params;
    const result = await pool.query(
      `SELECT t.*, r.name as restaurant_name
       FROM Tables t
       JOIN Restaurants r ON t.restaurant_id = r.restaurant_id
       WHERE t.table_no = $1 AND t.restaurant_id = $2`, 
      [table_no, restaurant_id]
    );
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
    
    // Check if restaurant exists
    const restaurantCheck = await pool.query(
      "SELECT * FROM Restaurants WHERE restaurant_id = $1",
      [restaurant_id]
    );
    
    if (restaurantCheck.rows.length === 0) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    
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
    
    // Check if the table exists
    const tableCheck = await pool.query(
      "SELECT * FROM Tables WHERE table_no = $1 AND restaurant_id = $2",
      [table_no, restaurant_id]
    );
    
    if (tableCheck.rows.length === 0) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    // Check if table has active reservations before setting it unavailable
    if (is_available === false) {
      const activeReservations = await pool.query(
        `SELECT * FROM Reservations 
         WHERE table_id = $1 
         AND restaurant_id = $2
         AND date >= CURRENT_DATE
         AND status = 1`, // Status 1 = confirmed
        [table_no, restaurant_id]
      );
      
      if (activeReservations.rows.length > 0) {
        return res.status(400).json({ 
          error: "Cannot mark table as unavailable - it has active reservations",
          reservations: activeReservations.rows
        });
      }
    }
    
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
    
    // Check if the table has associated reservations
    const reservationCheck = await pool.query(
      "SELECT * FROM Reservations WHERE table_id = $1 AND restaurant_id = $2",
      [table_no, restaurant_id]
    );
    
    if (reservationCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete table - it has associated reservations. Cancel the reservations first.",
        reservations: reservationCheck.rows
      });
    }
    
    const result = await pool.query(
      "DELETE FROM Tables WHERE table_no = $1 AND restaurant_id = $2 RETURNING *", 
      [table_no, restaurant_id]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Table not found" });
    res.json({ message: "Table deleted", table: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all reservations for a specific table
router.get("/:table_no/:restaurant_id/reservations", async (req, res) => {
  try {
    const { table_no, restaurant_id } = req.params;
    
    const result = await pool.query(
      `SELECT r.*, u.name as user_name 
       FROM Reservations r
       JOIN Users u ON r.user_id = u.user_id
       WHERE r.table_id = $1 AND r.restaurant_id = $2
       ORDER BY r.date, r.time`,
      [table_no, restaurant_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;