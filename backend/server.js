// ============================================
// Load environment variables from .env file
// ============================================
const dotenv = require("dotenv");
dotenv.config();

// ============================================
// Import dependencies
// ============================================
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

// ============================================
// Initialize Express app
// ============================================
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================

// Enable CORS so the frontend can talk to this backend
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// ============================================
// Database Connection
// ============================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

// Test the database connection on startup
pool.query("SELECT NOW()")
    .then((res) => {
        console.log("Database connected successfully at:", res.rows[0].now);
    })
    .catch((err) => {
        console.error("Database connection failed:", err.message);
    });

// ============================================
// Routes
// ============================================

// Root route - just to check if the server is running
app.get("/", (req, res) => {
    res.json({ message: "API is running" });
});

// GET /notes - Return all data (newest first)
app.get("/data", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM data"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching data:", err.message);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

// ============================================
// Start the server
// ============================================
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});