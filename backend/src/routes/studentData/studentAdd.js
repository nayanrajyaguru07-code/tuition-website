const express = require("express");
const pool = require("../../connections/DB.connect.js");
const format = require("pg-format"); // For safe bulk SQL queries

const router = express.Router();

// --- HELPER FUNCTION (Unchanged) ---
/**
 * Converts a DD-MM-YYYY date string to YYYY-MM-DD.
 * Returns null if the input is invalid or null.
 */
const formatDateToISO = (dateString) => {
  if (!dateString) {
    return null;
  }
  const parts = dateString.split("-"); // e.g., ['24', '11', '2009']
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // e.g., '2009-11-24'
  }
  return null; // Return null if format is not as expected
};
// ----------------------------

// --- BULK UPLOAD STUDENTS (POST /) ---
router.post("/", async (req, res) => {
  const { students } = req.body;

  if (!students || !Array.isArray(students) || students.length === 0) {
    return res
      .status(400)
      .json({ error: "A non-empty array of students is required." });
  }

  let client;

  try {
    // --- VALIDATION (remains the same) ---
    // This validation checks for the *absolute minimum* required fields.
    // All other new fields are treated as optional.
    let invalidStudent = null;
    let errorMessage = "";

    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      if (!student.gr_no || !student.student_name || !student.class_id) {
        errorMessage = `Invalid data at row ${
          i + 1
        }. 'gr_no', 'student_name', and 'class_id' are all required.`;
        invalidStudent = student;
        break;
      }

      if (isNaN(Number(student.class_id))) {
        errorMessage = `Invalid data at row ${
          i + 1
        }. 'class_id' must be a valid number, but received '${
          student.class_id
        }'.`;
        invalidStudent = student;
        break;
      }
    }

    if (invalidStudent) {
      console.error(errorMessage, invalidStudent);
      return res.status(400).json({
        error: errorMessage,
        invalid_student_data: invalidStudent,
      });
    }
    // --- END OF VALIDATION ---

    client = await pool.connect();

    // --- MODIFIED 'columns' ARRAY ---
    // This array now matches all the fields you provided
    const columns = [
      "gr_no",
      "student_name",
      "date_of_birth",
      "place_of_birth",
      "gender",
      "blood_group",
      "nationality",
      "religion",
      "class_id",
      "admission_date",
      "father_name",
      "mother_name",
      "parent_primary_phone",
      "parent_secondary_phone",
      "parent_email",
      "address_line1",
      "address_line2",
      "city",
      "state",
      "pincode",
      "community",
      "caste_category",
    ];

    // --- MODIFIED .map() SECTION ---
    // This now maps all 22 fields, using null as a fallback for optional ones
    const values = students.map((student) => [
      student.gr_no, // Required
      student.student_name, // Required
      formatDateToISO(student.date_of_birth), // Use helper
      student.place_of_birth || null,
      student.gender || null,
      student.blood_group || null,
      student.nationality || null,
      student.religion || null,
      Number(student.class_id), // Required
      formatDateToISO(student.admission_date), // Use helper
      student.father_name || null,
      student.mother_name || null,
      student.parent_primary_phone || null,
      student.parent_secondary_phone || null,
      student.parent_email || null,
      student.address_line1 || null,
      student.address_line2 || null,
      student.city || null,
      student.state || null,
      student.pincode || null,
      student.community || null,
      student.caste_category || null,
    ]);
    // -------------------------------

    const query = format("INSERT INTO student (%I) VALUES %L", columns, values);

    const result = await client.query(query);

    res.status(201).json({
      message: `${result.rowCount} students uploaded successfully!`,
      count: result.rowCount,
    });
  } catch (err) {
    console.error("Bulk Student Upload Error:", err);
    // Handle specific database errors, like unique constraint violations
    if (err.code === "23505") {
      // Unique violation
      return res.status(409).json({
        error: `An error occurred: ${err.detail}. One or more admission numbers may already exist.`,
      });
    }
    // Handle foreign key errors, e.g., invalid class_id
    if (err.code === "23503") {
      // Foreign key violation
      return res.status(400).json({
        error: `An error occurred: ${err.detail}. This may be due to an invalid 'class_id' that does not exist.`,
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

// --- GET A LIST OF ALL STUDENTS (GET /) ---
// --- (Unchanged) ---
// This route is for fetching a *summary list* of students,
// so it intentionally selects only a few key columns.
router.get("/", async (req, res) => {
  try {
    const students = await pool.query(`
SELECT 
  s.id, s.gr_no, s.student_name,
  c.standard, c.division, s.status, s.caste_category, s.community
FROM student s
JOIN classes c ON s.class_id = c.id
ORDER BY c.standard, c.division, s.student_name;
  `);
    res.status(200).json(students.rows);
  } catch (err) {
    console.error("Get Students Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
