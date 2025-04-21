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

    // Restaurants Table - Added image_url column
    await client.query(`
      CREATE TABLE IF NOT EXISTS Restaurants (
        restaurant_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        location VARCHAR(255) NOT NULL,
        rating DECIMAL(2,1),
        opening_hours VARCHAR(255),
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Cuisines Table (Using cuisine_name as Primary Key)
    await client.query(`
      CREATE TABLE IF NOT EXISTS Cuisines (
        cuisine_name VARCHAR(255) PRIMARY KEY
      );
    `);

    // Restaurant_Cuisines Table (Linking with cuisine_name)
    await client.query(`
      CREATE TABLE IF NOT EXISTS Restaurant_Cuisines (
        restaurant_cuisine_id SERIAL PRIMARY KEY,
        restaurant_id INTEGER REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
        cuisine_name VARCHAR(255) REFERENCES Cuisines(cuisine_name) ON DELETE CASCADE
      );
    `);

    // MenuItems Table - Added image_url column
    await client.query(`
      CREATE TABLE IF NOT EXISTS MenuItems (
        item_id SERIAL PRIMARY KEY,
        restaurant_id INTEGER REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        availability BOOLEAN DEFAULT TRUE,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tables Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Tables (
        table_no SERIAL PRIMARY KEY,
        restaurant_id INTEGER REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
        capacity INTEGER NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        type VARCHAR(255)
      );
    `);

    // Reservations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Reservations (
        reservation_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
        restaurant_id INTEGER REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE,
        table_id INTEGER REFERENCES Tables(table_no) ON DELETE SET NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        end_time TIME,
        guests INTEGER NOT NULL,
        status INTEGER NOT NULL DEFAULT 0,
        special_requests TEXT,
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

    console.log("✅ All tables created successfully!");
    await insertDummyData();

  } catch (error) {
    console.error("❌ Error setting up database:", error);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
};

// Function to insert dummy data
const insertDummyData = async () => {
  try {
    // Insert Users
    const userExists = await client.query("SELECT 1 FROM Users LIMIT 1");
    if (userExists.rowCount === 0) {
      await client.query(`
        INSERT INTO Users (name, email, password_hash, role)
        VALUES
          -- Admins
          ('Admin Alex', 'admin@dinesmart.com', '$2b$10$fakehash1', 0),
          
          -- Restaurant Owners (5)
          ('Chef Marco', 'marco@pastapalace.com', '$2b$10$fakehash2', 1),
          ('Owner Lily', 'lily@sushiworld.com', '$2b$10$fakehash3', 1),
          ('Chef Carlos', 'carlos@tacofiesta.com', '$2b$10$fakehash4', 1),
          ('Owner Raj', 'raj@curryhouse.com', '$2b$10$fakehash5', 1),
          ('Chef Sophie', 'sophie@bistrot.com', '$2b$10$fakehash6', 1),
          
          -- Customers (4)
          ('John Doe', 'john@example.com', '$2b$10$fakehash7', 2),
          ('Alice Smith', 'alice@example.com', '$2b$10$fakehash8', 2),
          ('Bob Johnson', 'bob@example.com', '$2b$10$fakehash9', 2),
          ('Emma Davis', 'emma@example.com', '$2b$10$fakehash10', 2);
      `);
      console.log("✅ Dummy users inserted.");
    }

    // Insert Restaurants (with updated locations and added image URLs)
    const restaurantExists = await client.query("SELECT 1 FROM Restaurants LIMIT 1");
    if (restaurantExists.rowCount === 0) {
      await client.query(`
        INSERT INTO Restaurants (name, location, rating, opening_hours, image_url)
        VALUES
          -- Italian (3)
          ('Pasta Palace', 'Bahadurabad', 4.5, '11:00-22:00', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745176623/75847f46-94ec-4db9-9720-5f6ea0f991bd.png'),
          ('Trattoria Roma', 'Bahadurabad', 4.2, '12:00-23:00', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745176661/e30b685a-ce49-47d4-978d-fdfda896d6ca.png'),
          ('Gelato Heaven', 'Bahadurabad', 4.8, '10:00-21:00', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745176716/4219dc0b-322b-46cd-9337-a67b681a4677.png'),
          
          -- Mexican (2)
          ('Taco Fiesta', 'Bahadurabad', 4.1, '10:00-20:00', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745176731/68a23598-d02e-4964-897d-a79263fa2b73.png'),
          ('Burrito Loco', 'Bahadurabad', 3.9, '11:00-19:00', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745176772/4cf17e4e-79c1-44bd-a02d-7d0c76021a6e.png'),
          
          -- Japanese (3)
          ('Sushi World', 'Bahadurabad', 4.7, '11:30-22:30', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745176794/fbf6b118-2385-4c5a-a1a9-2780b307f51e.png'),
          ('Ramen House', 'Defence', 4.3, '12:00-21:00', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745176853/f131a34a-5f09-4978-b6ad-a7087593b14b.png'),
          ('Tokyo Grill', 'Defence', 4.0, '17:00-23:00', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745176908/be176184-a0f2-4d99-8909-57e76a8bb841.png'),
          
          -- Indian (2)
          ('Curry House', 'Defence', 4.4, '11:00-21:30', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745176934/78316172-11d6-487d-9624-28c8112a1cd0.png'),
          ('Spice Garden', 'Defence', 4.6, '12:00-22:00', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745176948/1d053f16-9fc5-4e50-b5cc-1a8b935017ee.png'),
          
          -- French (2)
          ('Le Bistro', 'Defence', 4.9, '08:00-20:00', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745176982/f6d772e8-038c-4c29-b545-42f95bacf9fe.png'),
          ('Petit Paris', 'Defence', 4.2, '09:00-19:00', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745177014/217e0095-a104-4968-89c7-9cebaacff2f4.png'),
          
          -- Chinese (2)
          ('Dragon Wok', 'Defence', 3.8, '10:30-21:00', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745177040/3aae31c4-99d4-4de4-9d9b-dfa8ca4308a4.png'),
          ('Lucky Noodle', 'Johar', 4.1, '11:00-22:00', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745177081/32504af6-7888-4983-a00c-b23111055501.png'),
          
          -- Thai (1)
          ('Thai Orchid', 'Johar', 4.5, '12:00-21:30', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745177097/7f1dab38-f268-4a72-8521-003ffec4d027.png'),
          
          -- Mediterranean (2)
          ('Olive Tree', 'Johar', 4.3, '10:00-20:00', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745177133/f3c74881-70fc-4a00-b0ea-16d8946288c7.png'),
          ('Falafel King', 'Johar', 4.0, '11:00-19:00', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745177162/a031296b-1a0f-4865-8421-b2bcd2d5827f.png'),
          
          -- American (1)
          ('The Burger Joint', 'Johar', 3.7, '08:00-22:00', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745177200/464d0da4-f733-47bc-b1b4-d1c75633eec5.png'),
          
          -- Vietnamese (1)
          ('Pho 99', 'Johar', 4.4, '10:00-21:00', 'https://res.cloudinary.com/dfuedbntn/image/upload/v1745177218/fa1fc957-faf1-4348-a42d-c5df7ea896ba.png');
      `);
      console.log("✅ Dummy restaurants inserted.");
    }

    // Insert Cuisines
    const cuisineExists = await client.query("SELECT 1 FROM Cuisines LIMIT 1");
    if (cuisineExists.rowCount === 0) {
      await client.query(`
        INSERT INTO Cuisines (cuisine_name)
        VALUES
          ('Italian'),
          ('Mexican'),
          ('Japanese'),
          ('Indian'),
          ('French'),
          ('Chinese'),
          ('Thai'),
          ('Mediterranean'),
          ('American'),
          ('Vietnamese');
      `);
      console.log("✅ Dummy cuisines inserted.");
    }

    // Insert Menu Items (adding image_url)
    const menuExists = await client.query("SELECT 1 FROM MenuItems LIMIT 1");
    if (menuExists.rowCount === 0) {
      await client.query(`
        INSERT INTO MenuItems (restaurant_id, name, description, price, availability, image_url)
        VALUES
          /* 1. Pasta Palace (Italian) */
          (1, 'Spaghetti Carbonara', 'Classic pasta with egg, pancetta, and pecorino', 14.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782173/spaghetti_carbonara_wgm9tm.png'),
          (1, 'Margherita Pizza', 'Tomato sauce, fresh mozzarella, basil', 12.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782167/margherita_pizza_s6bcsc.png'),
          (1, 'Tiramisu', 'Coffee-flavored dessert with mascarpone', 8.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/tiramisu_xe40oh.png'),
          (1, 'Chicken Parmigiana', 'Breaded chicken with tomato sauce and mozzarella', 16.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782158/chicken_parmigiana_quhtbl.png'),
          (1, 'Risotto ai Funghi', 'Creamy risotto with wild mushrooms', 15.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782173/Risotto_ai_Funghi_xryfox.png'),
          (1, 'Garlic Bread', 'Toasted bread with garlic butter', 5.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782163/Garlic_Bread_kepm69.png'),
      
          /* 2. Trattoria Roma (Italian) */
          (2, 'Fettuccine Alfredo', 'Pasta in creamy Parmesan sauce', 15.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782161/Fettuccine_Alfredo_yefgsw.png'),
          (2, 'Lasagna Bolognese', 'Layered pasta with meat sauce', 17.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782166/Lasagna_Bolognese_ocaalr.png'),
          (2, 'Caprese Salad', 'Tomatoes, mozzarella, basil, balsamic glaze', 10.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782158/Caprese_Salad_omzpzv.png'),
          (2, 'Osso Buco', 'Braised veal shanks with gremolata', 24.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782172/Osso_Buco_yflwfe.png'),
          (2, 'Panna Cotta', 'Italian custard with berry sauce', 7.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782172/Panna_Cotta_g3gfnd.png'),
      
          /* 3. Gelato Heaven (Italian) */
          (3, 'Vanilla Gelato', 'Classic creamy vanilla', 4.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Vanilla_Gelato_p84fdu.png'),
          (3, 'Pistachio Gelato', 'Rich Sicilian pistachio flavor', 5.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782173/Pistachio_Gelato_nwrvwp.png'),
          (3, 'Affogato', 'Vanilla gelato with espresso shot', 6.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782157/affogato_aom8l0.png'),
          (3, 'Sorbet Trio', 'Lemon, mango, raspberry', 7.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782173/sorbet_trio_ngiywy.png'),
          (3, 'Chocolate Hazelnut', 'Decadent Nutella-flavored gelato', 5.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782158/chocolate_hazelnut_dx5a89.png'),
      
          /* 4. Taco Fiesta (Mexican) */
          (4, 'Carne Asada Tacos', 'Grilled steak tacos with cilantro/onions', 10.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782157/Carne_Asada_Tacos_ao0crc.png'),
          (4, 'Guacamole + Chips', 'Fresh avocado dip with tortilla chips', 8.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782163/Guacamole_Chips_uh1m23.png'),
          (4, 'Chicken Quesadilla', 'Grilled flour tortilla with cheese', 12.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782158/Chicken_Quesadilla_pgf0jx.png'),
          (4, 'Churros', 'Cinnamon sugar pastry with chocolate dip', 6.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782158/churros_lchkt2.png'),
          (4, 'Horchata', 'Traditional rice milk drink', 3.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782164/horchata_s9zcyf.png'),
      
          /* 5. Burrito Loco (Mexican) */
          (5, 'Super Burrito', 'Flour tortilla with rice, beans, meat', 11.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782178/super_burrito_mmkjqi.png'),
          (5, 'Nachos Supreme', 'Tortilla chips with cheese/beans/guacamole', 10.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782172/Nachos_Supreme_pbuxez.png'),
          (5, 'Enchiladas Verdes', 'Corn tortillas with green sauce', 13.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782159/Enchiladas_Verdes_tvyl43.png'),
          (5, 'Mexican Street Corn', 'Grilled corn with mayo/chili powder', 5.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782167/mexican_street_corn_ibefp9.png'),
          (5, 'Flan', 'Caramel custard dessert', 5.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782162/flan_novb3u.png'),
      
          /* 6. Sushi World (Japanese) */
          (6, 'California Roll', 'Crab, avocado, cucumber', 8.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782158/California_Roll_uxytdr.png'),
          (6, 'Salmon Nigiri', 'Fresh salmon over pressed rice', 6.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782173/salmon_nigiri_ammam0.png'),
          (6, 'Dragon Roll', 'Eel and avocado topped with eel sauce', 14.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782159/dragon_roll_mffknd.png'),
          (6, 'Miso Soup', 'Traditional Japanese soup', 2.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782167/miso_soup_cpviri.png'),
          (6, 'Tempura Udon', 'Noodle soup with shrimp tempura', 12.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/tempura_udon_xp8sor.png'),
          (6, 'Green Tea Ice Cream', 'Matcha-flavored dessert', 5.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782163/green_tea_ice_cream_igaydd.png'),
      
          /* 7. Ramen House (Japanese) */
          (7, 'Tonkotsu Ramen', 'Pork bone broth with noodles', 13.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Tonkotsu_Ramen_fyy3ue.png'),
          (7, 'Spicy Miso Ramen', 'Rich miso broth with chili oil', 14.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782174/Spicy_Miso_Ramen_lwo7ed.png'),
          (7, 'Gyoza', 'Pan-fried pork dumplings', 7.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782163/gyoza_ip2ohs.png'),
          (7, 'Chashu Don', 'Rice bowl with braised pork', 11.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782157/chashu_don_wpq1ti.png'),
          (7, 'Matcha Latte', 'Green tea with steamed milk', 4.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782167/matcha_latte_ampqrd.png'),
      
          /* 8. Tokyo Grill (Japanese) */
          (8, 'Teriyaki Chicken', 'Grilled chicken with sweet soy glaze', 15.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/teriyaki_chicken_aggmaf.png'),
          (8, 'Beef Yakiniku', 'Grilled marinated beef', 18.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782157/Beef_Yakiniku_ppplaq.png'),
          (8, 'Sashimi Platter', 'Assorted fresh raw fish', 22.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782173/Sashimi_Platter_tl9ava.png'),
          (8, 'Edamame', 'Steamed salted soybeans', 4.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782159/Edamame_bpddru.png'),
          (8, 'Mochi Ice Cream', 'Rice cake with ice cream filling', 6.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782168/Mochi_Ice_Cream_rs4icg.png'),
      
          /* 9. Curry House (Indian) */
          (9, 'Chicken Tikka Masala', 'Grilled chicken in creamy tomato sauce', 16.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782158/Chicken_Tikka_Masala_v5bksx.png'),
          (9, 'Lamb Vindaloo', 'Spicy curry with potatoes', 18.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782164/Lamb_Vindaloo_m0ehko.png'),
          (9, 'Garlic Naan', 'Leavened bread with garlic', 3.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782163/Garlic_Naan_wmrbq7.png'),
          (9, 'Samosa', 'Fried pastry with spiced potatoes', 5.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782173/samosa_zb0d6t.png'),
          (9, 'Mango Lassi', 'Yogurt drink with mango', 4.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782167/Mango_Lassi_xhni2c.png'),
      
          /* 10. Spice Garden (Indian) */
          (10, 'Butter Chicken', 'Tandoori chicken in buttery sauce', 17.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782157/Butter_Chicken_okoajk.png'),
          (10, 'Vegetable Biryani', 'Fragrant rice with mixed veggies', 14.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Vegetable_Biryani_gpqjcl.png'),
          (10, 'Palak Paneer', 'Spinach and cottage cheese curry', 13.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782172/Palak_Paneer_koixkp.png'),
          (10, 'Raita', 'Yogurt with cucumber/mint', 3.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Raita_opqrst.png'),
          (10, 'Gulab Jamun', 'Sweet milk dumplings in syrup', 5.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Gulab_Jamun_uvwxyz.png'),
      
          /* 11. Le Bistro (French) */
          (11, 'Coq au Vin', 'Chicken braised in red wine', 22.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Coq_au_Vin_abcdef.png'),
          (11, 'Croque Monsieur', 'Ham and cheese grilled sandwich', 12.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Croque_Monsieur_ghijkl.png'),
          (11, 'French Onion Soup', 'Caramelized onion soup with cheese', 9.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/French_Onion_Soup_mnopqr.png'),
          (11, 'Duck Confit', 'Slow-cooked duck leg', 24.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Duck_Confit_stuvwx.png'),
          (11, 'Crème Brûlée', 'Vanilla custard with caramelized sugar', 8.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Creme_Brulee_yzabcd.png'),
      
          /* 12. Petit Paris (French) */
          (12, 'Steak Frites', 'Grilled steak with French fries', 21.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Steak_Frites_efghij.png'),
          (12, 'Quiche Lorraine', 'Savory pie with bacon/cheese', 14.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Quiche_Lorraine_klmnop.png'),
          (12, 'Escargot', 'Snails in garlic butter', 16.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Escargot_qrstuv.png'),
          (12, 'Ratatouille', 'Provençal vegetable stew', 13.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Ratatouille_wxyzab.png'),
          (12, 'Macarons', 'Assorted French cookies', 9.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Macarons_cdefgh.png'),
      
          /* 13. Dragon Wok (Chinese) */
          (13, 'General Tso Chicken', 'Crispy chicken in sweet/spicy sauce', 13.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/General_Tso_Chicken_ijklmn.png'),
          (13, 'Beef with Broccoli', 'Stir-fried beef with vegetables', 15.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Beef_with_Broccoli_opqrst.png'),
          (13, 'Pork Dumplings', 'Steamed or fried', 8.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Pork_Dumplings_uvwxyz.png'),
          (13, 'Egg Fried Rice', 'Classic fried rice with vegetables', 10.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Egg_Fried_Rice_abcdef.png'),
          (13, 'Fortune Cookie', 'Crispy cookie with message', 1.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Fortune_Cookie_ghijkl.png'),
      
          /* 14. Lucky Noodle (Chinese) */
          (14, 'Peking Duck', 'Crispy duck with pancakes', 28.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Peking_Duck_mnopqr.png'),
          (14, 'Dan Dan Noodles', 'Spicy Sichuan noodles', 12.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Dan_Dan_Noodles_stuvwx.png'),
          (14, 'Kung Pao Shrimp', 'Stir-fried shrimp with peanuts', 17.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Kung_Pao_Shrimp_yzabcd.png'),
          (14, 'Wonton Soup', 'Pork dumplings in clear broth', 8.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Wonton_Soup_efghij.png'),
          (14, 'Mooncake', 'Traditional pastry with filling', 6.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Mooncake_klmnop.png'),
      
          /* 15. Thai Orchid (Thai) */
          (15, 'Pad Thai', 'Stir-fried rice noodles with peanuts', 14.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Pad_Thai_qrstuv.png'),
          (15, 'Green Curry', 'Coconut curry with chicken/veggies', 15.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Green_Curry_wxyzab.png'),
          (15, 'Tom Yum Soup', 'Spicy/sour soup with shrimp', 10.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Tom_Yum_Soup_cdefgh.png'),
          (15, 'Mango Sticky Rice', 'Sweet dessert with coconut milk', 7.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Mango_Sticky_Rice_ijklmn.png'),
          (15, 'Thai Iced Tea', 'Sweet spiced tea with milk', 4.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Thai_Iced_Tea_opqrst.png'),
      
          /* 16. Olive Tree (Mediterranean) */
          (16, 'Chicken Shawarma', 'Marinated chicken in pita', 12.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Chicken_Shawarma_uvwxyz.png'),
          (16, 'Falafel Plate', 'Chickpea fritters with hummus', 11.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Falafel_Plate_abcdef.png'),
          (16, 'Greek Salad', 'Cucumbers, tomatoes, feta, olives', 9.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Greek_Salad_ghijkl.png'),
          (16, 'Baklava', 'Layered pastry with nuts/honey', 6.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Baklava_mnopqr.png'),
          (16, 'Mint Lemonade', 'Refreshing mint-flavored drink', 4.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Mint_Lemonade_stuvwx.png'),
      
          /* 17. Falafel King (Mediterranean) */
          (17, 'Falafel Wrap', 'Crispy falafel in pita with tahini', 10.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Falafel_Wrap_yzabcd.png'),
          (17, 'Hummus Plate', 'Creamy chickpea dip with pita', 8.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Hummus_Plate_efghij.png'),
          (17, 'Lamb Kebabs', 'Grilled skewered lamb', 16.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Lamb_Kebabs_klmnop.png'),
          (17, 'Tabouleh', 'Parsley and bulgur salad', 7.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Tabouleh_qrstuv.png'),
          (17, 'Kunafa', 'Cheese pastry with syrup', 7.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Kunafa_wxyzab.png'),
      
          /* 18. The Burger Joint (American) */
          (18, 'Classic Cheeseburger', 'Beef patty with cheese/lettuce/tomato', 10.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Classic_Cheeseburger_cdefgh.png'),
          (18, 'Bacon BBQ Burger', 'Burger with bacon and BBQ sauce', 12.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Bacon_BBQ_Burger_ijklmn.png'),
          (18, 'Chicken Wings', 'Fried wings with choice of sauce', 11.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Chicken_Wings_opqrst.png'),
          (18, 'Onion Rings', 'Crispy battered onions', 5.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Onion_Rings_uvwxyz.png'),
          (18, 'Chocolate Milkshake', 'Thick chocolate shake', 6.50, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Chocolate_Milkshake_abcdef.png'),
      
          /* 19. Pho 99 (Vietnamese) */
          (19, 'Beef Pho', 'Noodle soup with rare beef', 12.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Beef_Pho_ghijkl.png'),
          (19, 'Spring Rolls', 'Fresh rolls with shrimp/herbs', 7.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Spring_Rolls_mnopqr.png'),
          (19, 'Banh Mi Sandwich', 'Vietnamese baguette with pork', 9.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Banh_Mi_Sandwich_stuvwx.png'),
          (19, 'Lemongrass Chicken', 'Grilled chicken with rice', 14.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Lemongrass_Chicken_yzabcd.png'),
          (19, 'Vietnamese Iced Coffee', 'Strong coffee with condensed milk', 4.99, TRUE, 'https://res.cloudinary.com/dfuedbntn/image/upload/v1744782179/Vietnamese_Iced_Coffee_efghij.png')
      `);
      console.log("✅ Dummy menu items inserted.");
    }

    // Insert Tables
    const tableExists = await client.query("SELECT 1 FROM Tables LIMIT 1");
    if (tableExists.rowCount === 0) {
      await client.query(`
        INSERT INTO Tables (restaurant_id, capacity, is_available, type)
        VALUES 
          (1, 4, TRUE, 'Booth'),
          (1, 2, TRUE, 'Outdoor'),
          (2, 6, TRUE, 'Family'),
          (6, 8, TRUE, 'Tatami Room'),
          (6, 2, TRUE, 'Sushi Bar'),
          (11, 4, TRUE, 'Window'),
          (11, 2, TRUE, 'Romantic'),
          (15, 6, TRUE, 'Family'),
          (18, 4, TRUE, 'Booth'),
          (19, 8, TRUE, 'Large Group');
      `);
      console.log("✅ Dummy tables inserted.");
    }

    // Insert Restaurant Cuisines (Using cuisine_name as reference)
    const restaurantCuisineExists = await client.query("SELECT 1 FROM Restaurant_Cuisines LIMIT 1");
    if (restaurantCuisineExists.rowCount === 0) {
      await client.query(`
        INSERT INTO Restaurant_Cuisines (restaurant_id, cuisine_name)
        VALUES
          -- Italian
          (1, 'Italian'), (2, 'Italian'), (3, 'Italian'),
          
          -- Mexican
          (4, 'Mexican'), (5, 'Mexican'),
          
          -- Japanese
          (6, 'Japanese'), (7, 'Japanese'), (8, 'Japanese'),
          
          -- Indian
          (9, 'Indian'), (10, 'Indian'),
          
          -- French
          (11, 'French'), (12, 'French'),
          
          -- Chinese
          (13, 'Chinese'), (14, 'Chinese'),
          
          -- Thai
          (15, 'Thai'),
          
          -- Mediterranean
          (16, 'Mediterranean'), (17, 'Mediterranean'),
          
          -- American
          (18, 'American'),
          
          -- Vietnamese
          (19, 'Vietnamese')
      `);
      console.log("✅ Dummy restaurant cuisines inserted.");
    }

  } catch (error) {
    console.error("❌ Error inserting dummy data:", error);
  }
};

createTables();