import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // MUST be pooler URL
    ssl: { rejectUnauthorized: false },
    max: 5,                      // small pool for Neon
    idleTimeoutMillis: 30000,    // keep connections alive
    connectionTimeoutMillis: 20000, // allow cold start
    keepAlive: true,
});

pool.on("connect", () => {
    console.log("✅ Neon DB connected");
});

pool.on("error", (err) => {
    console.error("❌ Neon DB error:", err);
});

export default pool;
