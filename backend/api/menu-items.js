const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// GET all menu items (optionally filter by restaurant_id)
router.get("/", async (req, res) => {
  try {
    let query = "SELECT * FROM MenuItems";
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

// GET menu item by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM MenuItems WHERE item_id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Menu item not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new menu item
router.post("/", async (req, res) => {
  try {
    const { restaurant_id, name, description, price, availability } = req.body;
    const result = await pool.query(
      "INSERT INTO MenuItems (restaurant_id, name, description, price, availability) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [restaurant_id, name, description, price, availability]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update menu item
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurant_id, name, description, price, availability } = req.body;
    const result = await pool.query(
      "UPDATE MenuItems SET restaurant_id = $1, name = $2, description = $3, price = $4, availability = $5 WHERE item_id = $6 RETURNING *",
      [restaurant_id, name, description, price, availability, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Menu item not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE menu item
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM MenuItems WHERE item_id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Menu item not found" });
    res.json({ message: "Menu item deleted", item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
