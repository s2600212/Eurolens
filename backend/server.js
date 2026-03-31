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
const PORT = process.env.PORT || 3001;

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
const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl
    ? new Pool({
          connectionString: databaseUrl,
          ssl: {
              rejectUnauthorized: false,
          },
      })
    : null;

// Test the database connection on startup (only if configured)
if (pool) {
    pool.query("SELECT NOW()")
        .then((res) => {
            console.log("Database connected successfully at:", res.rows[0].now);
        })
        .catch((err) => {
            console.error("Database connection failed:", err.message);
        });
} else {
    console.warn("DATABASE_URL not set; /api/data will return mock payloads.");
}

// ============================================
// Routes
// ============================================

// Root route - just to check if the server is running
app.get("/", (req, res) => {
    res.json({ message: "API is running" });
});

// API routes
// ============================================
const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => {
    res.json({ message: "API is running", timestamp: Date.now() });
});

async function getData(req) {
    // For scaffolding: return a deterministic placeholder payload when DB is not configured.
    if (!pool) {
        return [
            {
                id: "mock-1",
                source: "mock",
                createdAt: new Date().toISOString(),
            },
        ];
    }

    const result = await pool.query("SELECT * FROM data");
    return result.rows;
}

// GET /api/data - Return all data (newest first)
apiRouter.get("/data", async (req, res) => {
    try {
        const rows = await getData(req);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching data:", err.message);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

app.use("/api", apiRouter);

// Backwards compatibility for any existing clients.
app.get("/data", async (req, res) => {
    try {
        const rows = await getData(req);
        res.json(rows);
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