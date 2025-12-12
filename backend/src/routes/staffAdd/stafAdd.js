const express = require("express");
const pool = require("../../connections/DB.connect.js");
const format = require("pg-format"); // For safe bulk SQL queries

const router = express.Router();

// --- BULK UPLOAD FACULTY (POST /) ---
/**
 * @route   POST /api/admin/bulk-upload/faculty
 * @desc    Bulk upload faculty from a JSON array into the main 'faculty' table.
 * @access  Private (Admin)
 */
router.post("/", async (req, res) => {
  const { faculty } = req.body;

  if (!faculty || !Array.isArray(faculty) || faculty.length === 0) {
    return res
      .status(400)
      .json({ error: "A non-empty array of faculty is required." });
  }

  let client;
  try {
    client = await pool.connect();
    // Define the columns in the 'faculty' table that we will be inserting into.
    const columns = [
      "f_name",
      "l_name",
      "email",
      "aadhar_number",
      "role",
      "address",
      "phone_number",
    ];

    // Map the incoming faculty data to a 2D array, ensuring correct order and handling missing values.
    const values = faculty.map((member) => [
      member.f_name,
      member.l_name,
      member.email,
      member.aadhar_number,
      member.role,
      member.address || null, // If a value is missing, it will be inserted as NULL
      member.phone_number || null,
    ]);

    // Use pg-format to safely create the bulk INSERT query.
    const query = format("INSERT INTO faculty (%I) VALUES %L", columns, values);

    const result = await client.query(query);

    res.status(201).json({
      message: `${result.rowCount} faculty members uploaded successfully!`,
      count: result.rowCount,
    });
  } catch (err) {
    console.error("Bulk Faculty Upload Error:", err);
    // Provide a more specific error for unique constraint violations
    if (err.code === "23505") {
      return res.status(409).json({
        error: `Upload failed. One or more records contain a duplicate email or Aadhar number that already exists in the system.`,
      });
    }
    res.status(500).json({
      error: `An error occurred during the bulk upload: ${err.message}`,
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

router.get("/", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const query = "SELECT * FROM faculty ORDER BY f_name, l_name";
    const result = await client.query(query);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Get Faculty Error:", err);
    res.status(500).json({
      error: `An error occurred while fetching faculty: ${err.message}`,
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;
