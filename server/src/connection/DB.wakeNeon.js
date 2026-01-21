import pool from "./DB.connect.js";

async function wakeNeon() {
    try {
        await pool.query("SELECT 1");
        console.log("🔥 Neon DB is awake");
    } catch (err) {
        console.error("❌ Failed to wake Neon");
        console.error("Message:", err.message);
        console.error("Code:", err.code);
        console.error("Stack:", err.stack);
    }
}

export default wakeNeon;
