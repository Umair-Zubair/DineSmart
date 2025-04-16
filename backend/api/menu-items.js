const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// GET all menu items (no filtering)
router.get("/", async (req, res) => {
  try {
    const query = "SELECT * FROM MenuItems";
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching all menu items:", err);
    res.status(500).json({ error: "Failed to retrieve menu items" });
  }
});

// GET menu items by restaurant_id as path parameter
router.get("/:restaurant_id", async (req, res) => {
  try {
    const { restaurant_id } = req.params;
    
    const query = "SELECT * FROM MenuItems WHERE restaurant_id = $1";
    const result = await pool.query(query, [restaurant_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No menu items found for this restaurant" });
    }
    
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching menu items by restaurant ID:", err);
    res.status(500).json({ error: "Failed to retrieve menu items" });
  }
});

// POST new menu item
router.post("/", async (req, res) => {
  try {
    const { restaurant_id, name, description, price, availability, image_url } = req.body;
    const result = await pool.query(
      "INSERT INTO MenuItems (restaurant_id, name, description, price, availability, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [restaurant_id, name, description, price, availability, image_url]
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
    const { restaurant_id, name, description, price, availability, image_url } = req.body;
    const result = await pool.query(
      "UPDATE MenuItems SET restaurant_id = $1, name = $2, description = $3, price = $4, availability = $5, image_url = $6 WHERE item_id = $7 RETURNING *",
      [restaurant_id, name, description, price, availability, image_url, id]
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