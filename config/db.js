const mysql = require("mysql2/promise");

let pool;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  multipleStatements: false,
  timezone: "+00:00",
};

// Create connection pool
const createPool = () => {
  try {
    pool = mysql.createPool(dbConfig);
    console.log("✅ MySQL connection pool created");
    return pool;
  } catch (error) {
    console.error("❌ Error creating MySQL pool:", error.message);
    throw error;
  }
};

// Initialize database and create tables
const initializeDatabase = async () => {
  try {
    if (!pool) {
      createPool();
    }

    // Test connection
    const connection = await pool.getConnection();
    console.log("✅ MySQL connection established");

    // Create orders table if it doesn't exist
    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        orderId INT AUTO_INCREMENT PRIMARY KEY,
        userUid VARCHAR(255) NOT NULL,
        pickupAddress TEXT NOT NULL,
        dropoffAddress TEXT NOT NULL,
        latPickup DECIMAL(10, 8) NOT NULL,
        lngPickup DECIMAL(11, 8) NOT NULL,
        latDropoff DECIMAL(10, 8) NOT NULL,
        lngDropoff DECIMAL(11, 8) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        orderType VARCHAR(100) NOT NULL,
        status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_userUid (userUid),
        INDEX idx_status (status),
        INDEX idx_createdAt (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createOrdersTable);
    console.log("✅ Orders table created/verified");

    connection.release();
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    throw error;
  }
};

// Get database connection from pool
const getConnection = async () => {
  try {
    if (!pool) {
      createPool();
    }
    return await pool.getConnection();
  } catch (error) {
    console.error("❌ Error getting database connection:", error.message);
    throw error;
  }
};

// Execute query with error handling
const executeQuery = async (query, params = []) => {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error("❌ Database query error:", error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Close pool (for graceful shutdown)
const closePool = async () => {
  if (pool) {
    try {
      await pool.end();
      console.log("✅ MySQL pool closed");
    } catch (error) {
      console.error("❌ Error closing MySQL pool:", error.message);
    }
  }
};

module.exports = {
  initializeDatabase,
  getConnection,
  executeQuery,
  closePool,
  pool: () => pool,
};
