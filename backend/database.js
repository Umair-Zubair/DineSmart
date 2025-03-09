require("dotenv").config();
const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const createTables = async () => {
  try {
    await client.connect();
    console.log("✅ Connected to the database.");

    // Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Users (
        user_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Restaurants Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Restaurants (
        restaurant_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        location VARCHAR(255) NOT NULL,
        rating DECIMAL(2,1),
        opening_hours VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Cuisines Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Cuisines (
        cuisine_id SERIAL PRIMARY KEY,
        cuisine_name VARCHAR(255) NOT NULL UNIQUE
      );
    `);

    // Restaurant_Cuisines Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Restaurant_Cuisines (
        restaurant_cuisine_id SERIAL PRIMARY KEY,
        restaurant_id INTEGER REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
        cuisine_id INTEGER REFERENCES Cuisines(cuisine_id) ON DELETE CASCADE
      );
    `);

    // MenuItems Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS MenuItems (
        item_id SERIAL PRIMARY KEY,
        restaurant_id INTEGER REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        availability BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Reservations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Reservations (
        reservation_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
        restaurant_id INTEGER REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time TIME NOT NULL,
        guests INTEGER NOT NULL,
        status INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Orders Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Orders (
        order_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
        restaurant_id INTEGER REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
        order_status INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reservation_id INTEGER REFERENCES Reservations(reservation_id) ON DELETE SET NULL
      );
    `);

    // OrderItems Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS OrderItems (
        order_item_id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES Orders(order_id) ON DELETE CASCADE,
        item_id INTEGER REFERENCES MenuItems(item_id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL
      );
    `);

    // Reviews Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Reviews (
        review_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
        restaurant_id INTEGER REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
        rating DECIMAL(2,1) NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tables Table (All tables available by default)
    await client.query(`
      CREATE TABLE IF NOT EXISTS Tables (
        table_no SERIAL PRIMARY KEY,
        restaurant_id INTEGER REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
        capacity INTEGER NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        type VARCHAR(255)
      );
    `);

    console.log("✅ All tables created successfully!");

    // Insert Dummy Data (Without ON CONFLICT)
    await insertDummyData();

  } catch (error) {
    console.error("❌ Error setting up database:", error);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
};

// Function to check if data exists before inserting
const insertDummyData = async () => {
  try {
    const userExists = await client.query("SELECT 1 FROM Users LIMIT 1");
    if (userExists.rowCount === 0) {
      await client.query(`
        INSERT INTO Users (name, email, password_hash, role)
        VALUES 
          ('John Doe', 'john@example.com', 'hashedpassword123', 1),
          ('Alice Smith', 'alice@example.com', 'hashedpassword456', 2);
      `);
      console.log("✅ Dummy users inserted.");
    }

    const restaurantExists = await client.query("SELECT 1 FROM Restaurants LIMIT 1");
    if (restaurantExists.rowCount === 0) {
      await client.query(`
        INSERT INTO Restaurants (name, location, rating, opening_hours)
        VALUES 
          ('The Grill House', '123 Main St', 4.5, '10:00 AM - 11:00 PM'),
          ('Pasta Palace', '456 Elm St', 4.2, '11:00 AM - 10:00 PM');
      `);
      console.log("✅ Dummy restaurants inserted.");
    }

    const cuisineExists = await client.query("SELECT 1 FROM Cuisines LIMIT 1");
    if (cuisineExists.rowCount === 0) {
      await client.query(`
        INSERT INTO Cuisines (cuisine_name)
        VALUES 
          ('Italian'),
          ('Mexican'),
          ('American');
      `);
      console.log("✅ Dummy cuisines inserted.");
    }

    const menuExists = await client.query("SELECT 1 FROM MenuItems LIMIT 1");
    if (menuExists.rowCount === 0) {
      await client.query(`
        INSERT INTO MenuItems (restaurant_id, name, description, price, availability)
        VALUES 
          (1, 'Grilled Chicken', 'Juicy grilled chicken', 12.99, TRUE),
          (2, 'Spaghetti Carbonara', 'Classic Italian pasta', 10.50, TRUE);
      `);
      console.log("✅ Dummy menu items inserted.");
    }

    const reservationExists = await client.query("SELECT 1 FROM Reservations LIMIT 1");
    if (reservationExists.rowCount === 0) {
      await client.query(`
        INSERT INTO Reservations (user_id, restaurant_id, date, time, guests, status)
        VALUES 
          (1, 1, '2025-03-10', '19:00:00', 4, 1),
          (2, 2, '2025-03-11', '20:00:00', 2, 0);
      `);
      console.log("✅ Dummy reservations inserted.");
    }

    const tableExists = await client.query("SELECT 1 FROM Tables LIMIT 1");
    if (tableExists.rowCount === 0) {
      await client.query(`
        INSERT INTO Tables (restaurant_id, capacity, type)
        VALUES 
          (1, 4, 'Booth'),
          (1, 2, 'Outdoor'),
          (2, 6, 'Family');
      `);
      console.log("✅ Dummy tables inserted.");
    }

    const restaurantCuisineExists = await client.query("SELECT 1 FROM Restaurant_Cuisines LIMIT 1");
    if (restaurantCuisineExists.rowCount === 0) {
      await client.query(`
        INSERT INTO Restaurant_Cuisines (restaurant_id, cuisine_id)
        VALUES 
          (1, 3), -- The Grill House -> American
          (2, 1); -- Pasta Palace -> Italian
      `);
      console.log("✅ Dummy restaurant cuisines inserted.");
    }

  } catch (error) {
    console.error("❌ Error inserting dummy data:", error);
  }
};

createTables();
