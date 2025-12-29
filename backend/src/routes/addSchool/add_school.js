const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../../connections/DB.connect.js");

// --- GET: Fetch all colleges ---
router.get("/", async (req, res) => {
  try {
    const queryText = `
      SELECT id, name, created_at AS "createdAt"
      FROM "College"
      ORDER BY created_at DESC;
    `;

    const { rows } = await pool.query(queryText);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Failed to fetch colleges:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- POST: Register a new school/teacher ---
router.post("/", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ error: "Name, email, password, and role are required." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // If created_at has DEFAULT now(), you can omit it from VALUES.
    // We return created_at as "createdAt" to keep API shape.
    const queryText = `
      INSERT INTO "College" (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, created_at AS "createdAt", role;
    `;
    const queryParams = [name, email, hashedPassword, role];

    const { rows } = await pool.query(queryText, queryParams);
    const newCollege = rows[0];

    return res.status(201).json(newCollege);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email already in use." });
    }

    console.error("❌ Failed to create college:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- PUT: Update a school/teacher ---
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const { rows: existingRows } = await pool.query(
      `SELECT * FROM "College" WHERE id = $1`,
      [id]
    );
    if (existingRows.length === 0) {
      return res.status(404).json({ error: "College not found." });
    }

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
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const countResult = await pool.query(`SELECT COUNT(*) FROM "College"`);
    const totalRows = parseInt(countResult.rows[0].count, 10);

    if (totalRows <= 1) {
      return res.status(400).json({
        error:
          "At least one college entry must exist. Cannot delete the last record.",
      });
    }

    const { rowCount } = await pool.query(
      `DELETE FROM "College" WHERE id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "College not found." });
    }

    return res.status(200).json({ message: "College deleted successfully." });
  } catch (error) {
    console.error("❌ Failed to delete college:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
