const express = require("express");
const cors = require("cors");
const db = require("./src/db/init");
const authRoutes = require("./src/api/auth");
const gameRoutes = require("./src/api/games");
const cartRoutes = require("./src/api/cart");
const orderRoutes = require("./src/api/orders");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

const initializeDatabase = async () => {
  try {
    const connection = await db.getConnection();
    console.log("Connected to MySQL database");

    // Create database
    await connection.query("CREATE DATABASE IF NOT EXISTS nano_game_store");
    await connection.query("USE nano_game_store"); // Fixed: Using consistent database name

    // Create tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS games (
        game_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DOUBLE NOT NULL,
        genre VARCHAR(100),
        platform VARCHAR(100),
        stock_quantity INT NOT NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT,
        order_date DATETIME NOT NULL,
        total_amount DOUBLE NOT NULL,
        status VARCHAR(50) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT,
        game_id BIGINT,
        quantity INT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        FOREIGN KEY (game_id) REFERENCES games(game_id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT,
        game_id BIGINT,
        quantity INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (game_id) REFERENCES games(game_id)
      )
    `);

    // Create trigger
    await connection.query(`
      CREATE TRIGGER IF NOT EXISTS update_inventory_after_order
      AFTER INSERT ON order_items
      FOR EACH ROW
      BEGIN
        UPDATE games
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE game_id = NEW.game_id;
      END
    `);

    // Create view
    await connection.query(`
      CREATE OR REPLACE VIEW order_summary AS
      SELECT o.order_id, o.user_id, u.username, o.order_date, o.total_amount, o.status
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
    `);

    // Create stored procedure (fixed version)
    await connection.query(`
      CREATE PROCEDURE IF NOT EXISTS place_order(IN p_user_id BIGINT)
      BEGIN
        DECLARE v_total_amount DOUBLE;
        DECLARE v_game_id BIGINT;
        DECLARE v_quantity INT;
        DECLARE v_price DOUBLE;
        DECLARE v_order_id BIGINT;
        DECLARE done INT DEFAULT 0;
        DECLARE cur CURSOR FOR SELECT game_id, quantity FROM cart_items WHERE user_id = p_user_id;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          ROLLBACK;
          RESIGNAL;
        END;

        START TRANSACTION;

        -- Calculate total amount
        SELECT SUM(g.price * c.quantity)
        INTO v_total_amount
        FROM cart_items c
        JOIN games g ON c.game_id = g.game_id
        WHERE c.user_id = p_user_id;

        IF v_total_amount IS NULL THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cart is empty';
        END IF;

        -- Check stock availability
        SET done = 0;
        OPEN cur;
        stock_check: LOOP
          FETCH cur INTO v_game_id, v_quantity;
          IF done = 1 THEN LEAVE stock_check; END IF;
          SELECT price, stock_quantity INTO v_price, @stock FROM games WHERE game_id = v_game_id;
          IF @stock < v_quantity THEN
            SET @error_msg = CONCAT('Insufficient stock for game ID ', v_game_id);
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @error_msg;
          END IF;
        END LOOP;
        CLOSE cur;

        -- Insert order
        INSERT INTO orders (user_id, order_date, total_amount, status)
        VALUES (p_user_id, NOW(), v_total_amount, 'PROCESSING');
        SET v_order_id = LAST_INSERT_ID();

        -- Insert order items
        INSERT INTO order_items (order_id, game_id, quantity)
        SELECT v_order_id, game_id, quantity
        FROM cart_items
        WHERE user_id = p_user_id;

        -- Clear cart
        DELETE FROM cart_items WHERE user_id = p_user_id;
        COMMIT;
      END 
    `);

    connection.release();
  } catch (err) {
    console.error("Database initialization failed:", err);
    process.exit(1);
  }
};

initializeDatabase().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
