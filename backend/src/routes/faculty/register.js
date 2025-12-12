const express = require("express");
const pool = require("../../connections/DB.connect.js");

const router = express.Router();

// --- CREATE A NEW FACULTY MEMBER ---
/**
 * @route   POST /api/admin/faculty
 * @desc    Register a new faculty member.
 * @access  Private (Admin)
 */
router.post("/", async (req, res) => {
  const { F_name, L_name, email, aadhar_number, address, role, phone_number } =
    req.body;

  if (!F_name || !L_name || !email || !aadhar_number || !role) {
    return res.status(400).json({
      error:
        "First Name, Last Name, email, Aadhar number, and role are required.",
    });
  }

  try {
    const newFaculty = await pool.query(
      `INSERT INTO faculty (F_name, L_name, email, aadhar_number, address, phone_number, role)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, F_name, L_name, email, role, created_at`,
      [F_name, L_name, email, aadhar_number, address, phone_number, role]
    );

    res.status(201).json({
      message: "Faculty member successfully registered.",
      faculty: newFaculty.rows[0],
    });
  } catch (err) {
    console.error("Faculty Registration Error:", err);
    if (err.code === "23505") {
      // PostgreSQL unique violation error code
      return res.status(409).json({
        error:
          "A faculty member with this email or Aadhar number already exists.",
      });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- GET A LIST OF ALL FACULTY MEMBERS ---
/**
 * @route   GET /api/admin/faculty
 * @desc    Get all faculty members.
 * @access  Private (Admin)
 */
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, F_name, L_name, email, role, phone_number FROM faculty ORDER BY F_name, L_name"
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Faculty Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- UPDATE A FACULTY MEMBER'S DETAILS ---
/**
 * @route   PATCH /api/admin/faculty/:id
 * @desc    Update a faculty member's details.
 * @access  Private (Admin)
 */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Only allow columns that exist in your faculty table
  const allowedFields = [
    "F_name",
    "L_name",
    "email",
    "phone_number",
    "aadhar_number",
    "address",
    "role",
  ];

  // Filter only valid fields sent by the client
  const fields = Object.keys(updates).filter(
    (key) => updates[key] !== undefined && allowedFields.includes(key)
  );

  if (fields.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid fields provided for update." });
  }

  const setClause = fields
    .map((key, index) => `${key} = $${index + 1}`)
    .join(", ");
  const values = fields.map((key) => updates[key]);
  values.push(id); // For WHERE clause

  try {
    const { rows } = await pool.query(
      `UPDATE faculty SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Faculty member not found." });
    }

    res.status(200).json({
      message: "Faculty details updated successfully",
      faculty: rows[0],
    });
  } catch (err) {
    console.error("Update Faculty Error:", err);
    if (err.code === "23505") {
      return res.status(409).json({
        error: "Update failed. Duplicate email or Aadhar number.",
      });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- DELETE A FACULTY MEMBER ---
/**
 * @route   DELETE /api/admin/faculty/:id
 * @desc    Delete a faculty member's record.
 * @access  Private (Admin)
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM faculty WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Faculty member not found." });
    }
    res
      .status(200)
      .json({ message: "Faculty member record deleted successfully." });
  } catch (err) {
    console.error("Delete Faculty Error:", err);
    if (err.code === "23503") {
      return res.status(400).json({
        error:
          "Cannot delete faculty member. They are assigned to timetables or other records.",
      });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
