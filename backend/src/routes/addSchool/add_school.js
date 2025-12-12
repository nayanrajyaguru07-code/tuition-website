const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../../connections/DB.connect.js");

// --- GET: Fetch all colleges ---
// Path: GET /add_school
router.get("/", async (req, res) => {
  try {
    const queryText = `
      SELECT id, name, "createdAt" 
      FROM "College"
      ORDER BY "createdAt" DESC;
    `;

    const { rows } = await pool.query(queryText);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Failed to fetch colleges:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- POST: Register a new school/teacher ---
// Path: POST /add_school
router.post("/", async (req, res) => {
  try {
    // --- 1. Updated to include 'role' ---
    const { name, email, password, role } = req.body;

    // --- 2. Updated validation ---
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ error: "Name, email, password, and role are required." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // --- 3. Updated INSERT query to include 'role' ---
    const queryText = `
      INSERT INTO "College" (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, "createdAt", role;
    `;
    // --- 4. Added 'role' to parameters ---
    const queryParams = [name, email, hashedPassword, role];

    const { rows } = await pool.query(queryText, queryParams);
    const newCollege = rows[0];

    return res.status(201).json(newCollege);
  } catch (error) {
    if (error.code === "23505") {
      // 23505 is the error code for 'unique_violation'
      // We assume the email is the unique field causing this
      return res.status(409).json({ error: "Email already in use." });
    }

    console.error("❌ Failed to create college:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- PUT: Update a school/teacher ---
// Path: PUT /add_school/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    // Check if record exists
    const { rows: existingRows } = await pool.query(
      `SELECT * FROM "College" WHERE id = $1`,
      [id]
    );
    if (existingRows.length === 0) {
      return res.status(404).json({ error: "College not found." });
    }

    // Update password only if provided
    let hashedPassword = existingRows[0].password;
    if (password && password.trim() !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const queryText = `
      UPDATE "College"
      SET name = $1, email = $2, password = $3, role = $4
      WHERE id = $5
      RETURNING id, name, email, role;
    `;
    const queryParams = [name, email, hashedPassword, role, id];
    const { rows } = await pool.query(queryText, queryParams);

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("❌ Failed to update college:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- DELETE: Remove a school/teacher ---
// Path: DELETE /add_school/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Step 1: Count total rows
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM "College"`
    );
    const totalRows = parseInt(countResult.rows[0].count, 10);

    // ✅ Step 2: Prevent deleting the last record
    if (totalRows <= 1) {
      return res.status(400).json({
        error: "At least one college entry must exist. Cannot delete the last record.",
      });
    }

    // ✅ Step 3: Delete record by id
    const { rowCount } = await pool.query(
      `DELETE FROM "College" WHERE id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "College not found." });
    }

    return res
      .status(200)
      .json({ message: "College deleted successfully." });
  } catch (error) {
    console.error("❌ Failed to delete college:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
