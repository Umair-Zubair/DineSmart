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
    let query = `
      SELECT r.*, u.name as user_name, rest.name as restaurant_name, r.table_id as table_no 
      FROM Reservations r
      JOIN Users u ON r.user_id = u.user_id
      JOIN Restaurants rest ON r.restaurant_id = rest.restaurant_id
    `;
    
    const params = [];
    
    if (req.query.user_id) {
      query += " WHERE r.user_id = $1";
      params.push(req.query.user_id);
    } else if (req.query.restaurant_id) {
      query += " WHERE r.restaurant_id = $1";
      params.push(req.query.restaurant_id);
    }
    
    // Order by date/time for better usability
    query += " ORDER BY r.date, r.time";
    
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
    const query = `
      SELECT r.*, u.name as user_name, rest.name as restaurant_name, r.table_id as table_no
      FROM Reservations r
      JOIN Users u ON r.user_id = u.user_id
      JOIN Restaurants rest ON r.restaurant_id = rest.restaurant_id
      WHERE r.reservation_id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Reservation not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new reservation
router.post("/", async (req, res) => {
  try {
    // Extract fields from request body
    const { 
      user_id, 
      restaurant_id, 
      date, 
      time, 
      guests, 
      status, 
      special_requests 
    } = req.body;
    
    // Handle the table_no vs table_id mismatch - check both fields
    const table_id = req.body.table_id || req.body.table_no;
    
    // Validate that table_id exists
    if (!table_id) {
      return res.status(400).json({ error: "Table ID is required" });
    }
    
    // Calculate end time (1 hour from start time)
    const timeObj = new Date(`2000-01-01T${time}`);
    timeObj.setHours(timeObj.getHours() + 1); // 1 hour duration
    const end_time = timeObj.toTimeString().split(' ')[0];
    
    console.log(`Creating reservation for table ${table_id} from ${time} to ${end_time}`);
    
    // Check if table is available at the requested time
    const tableCheckQuery = `
      SELECT * FROM Reservations 
      WHERE table_id = $1 
      AND date = $2 
      AND status != 2 
      AND (
        (time <= $3 AND end_time > $3) OR 
        (time < $4 AND end_time >= $4) OR
        (time >= $3 AND end_time <= $4)
      )
    `;
    
    const tableCheck = await pool.query(tableCheckQuery, [
      table_id, 
      date, 
      time, 
      end_time
    ]);
    
    if (tableCheck.rows.length > 0) {
      return res.status(400).json({ error: "Table is already reserved for this time" });
    }
    
    const result = await pool.query(
      `INSERT INTO Reservations 
       (user_id, restaurant_id, table_id, date, time, end_time, guests, status, special_requests) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [user_id, restaurant_id, table_id, date, time, end_time, guests, status, special_requests]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating reservation:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update reservation
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      user_id, 
      restaurant_id, 
      date, 
      time, 
      guests, 
      status, 
      special_requests 
    } = req.body;
    
    // Handle the table_no vs table_id mismatch - check both fields
    const table_id = req.body.table_id || req.body.table_no;
    
    // Get current reservation
    const currentReservation = await pool.query(
      "SELECT * FROM Reservations WHERE reservation_id = $1", 
      [id]
    );
    
    if (currentReservation.rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    
    const current = currentReservation.rows[0];
    
    // Calculate end time (1 hour from start time)
    const timeObj = new Date(`2000-01-01T${time || current.time}`);
    timeObj.setHours(timeObj.getHours() + 1); // 1 hour duration
    const end_time = timeObj.toTimeString().split(' ')[0];
    
    // Check if date, time, or table is being changed
    if (table_id !== current.table_id || date !== current.date || time !== current.time) {
      const tableCheckQuery = `
        SELECT * FROM Reservations 
        WHERE table_id = $1 
        AND date = $2 
        AND status != 2
        AND reservation_id != $3
        AND (
          (time <= $4 AND end_time > $4) OR 
          (time < $5 AND end_time >= $5) OR
          (time >= $4 AND end_time <= $5)
        )
      `;
      
      const tableCheck = await pool.query(tableCheckQuery, [
        table_id, 
        date || current.date, 
        id,
        time || current.time, 
        end_time
      ]);
      
      if (tableCheck.rows.length > 0) {
        return res.status(400).json({ error: "Table is already reserved for this time" });
      }
    }
    
    const result = await pool.query(
      `UPDATE Reservations 
       SET user_id = $1, restaurant_id = $2, table_id = $3, date = $4, 
           time = $5, end_time = $6, guests = $7, status = $8, special_requests = $9 
       WHERE reservation_id = $10 
       RETURNING *`,
      [
        user_id || current.user_id, 
        restaurant_id || current.restaurant_id, 
        table_id || current.table_id, 
        date || current.date, 
        time || current.time, 
        end_time, 
        guests || current.guests, 
        status !== undefined ? status : current.status, 
        special_requests || current.special_requests, 
        id
      ]
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

// GET available tables for a restaurant at specified date/time
router.get("/available/:restaurant_id/:date/:time", async (req, res) => {
  try {
    const { restaurant_id, date, time } = req.params;
    
    // Calculate end time (1 hour from start time)
    const timeObj = new Date(`2000-01-01T${time}`);
    timeObj.setHours(timeObj.getHours() + 1); // 1 hour duration
    const end_time = timeObj.toTimeString().split(' ')[0];
    
    // Get all tables for this restaurant
    const tablesQuery = `
      SELECT * FROM Tables 
      WHERE restaurant_id = $1 
      AND is_available = TRUE
    `;
    
    const tables = await pool.query(tablesQuery, [restaurant_id]);
    
    if (tables.rows.length === 0) {
      return res.json([]);
    }
    
    // Check which tables are already reserved
    const reservedQuery = `
      SELECT table_id FROM Reservations 
      WHERE restaurant_id = $1 
      AND date = $2 
      AND status != 2
      AND (
        (time <= $3 AND end_time > $3) OR 
        (time < $4 AND end_time >= $4) OR
        (time >= $3 AND end_time <= $4)
      )
    `;
    
    const reserved = await pool.query(reservedQuery, [restaurant_id, date, time, end_time]);
    
    // Filter out tables that are already reserved
    const reservedTableIds = reserved.rows.map(row => row.table_id);
    const availableTables = tables.rows.filter(table => !reservedTableIds.includes(table.table_no));
    
    res.json(availableTables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;