// connections/DB.connect.js
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.NEON_URL,
  ssl: {
    rejectUnauthorized: false, // Neon requires this in many setups
  },
  // conservative pool settings for serverless/cloud DBs
  max: parseInt(process.env.PG_MAX_CLIENTS || "6", 10),
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_MS || "30000", 10),
  connectionTimeoutMillis: parseInt(
    process.env.PG_CONN_TIMEOUT_MS || "10000",
    10
  ),
  // allow the OS to keep sockets alive (helps against transient network drops)
  // node-postgres sets keepAlive by default on sockets; mentioning for clarity
});

pool.on("connect", (client) => {
  console.log(
    "pg pool: client connected - total:",
    pool.totalCount,
    "idle:",
    pool.idleCount,
    "waiting:",
    pool.waitingCount
  );
});

pool.on("acquire", (client) => {
  console.log(
    "pg pool: client acquired - total:",
    pool.totalCount,
    "idle:",
    pool.idleCount,
    "waiting:",
    pool.waitingCount
  );
});

pool.on("remove", (client) => {
  console.warn(
    "pg pool: client removed - total:",
    pool.totalCount,
    "idle:",
    pool.idleCount,
    "waiting:",
    pool.waitingCount
  );
});

pool.on("error", (err, client) => {
  console.error("pg pool: unexpected error on idle client", err);
});

process.on("SIGINT", async () => {
  try {
    console.log("SIGINT received: shutting down pg pool");
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error("Error while shutting down pool", e);
    process.exit(1);
  }
});

module.exports = pool;
