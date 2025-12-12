const express = require("express");
const pool = require("../../connections/DB.connect.js");

const router = express.Router();

// --- 1. GET ALL STUDENTS (Unchanged) ---
router.get("/students", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.student_name, c.standard, c.division
      FROM student s
      JOIN classes c ON s.class_id = c.id
      ORDER BY s.student_name;
    `);

    const formattedStudents = rows.map((student) => ({
      id: student.id,
      display_name: `${student.student_name} - Class ${student.standard} ${student.division}`,
    }));

    res.status(200).json(formattedStudents);
  } catch (err) {
    console.error("Get Students Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- 2. GET DUES FOR SINGLE STUDENT (Transport references removed) ---
router.get("/dues/:studentId", async (req, res) => {
  const { studentId } = req.params;

  const query = `
    WITH student_class AS (
      SELECT class_id FROM student WHERE id = $1
    ),

    class_dues AS (
      SELECT COALESCE(SUM(amount), 0) AS total 
      FROM fee_types
      WHERE class_id = (SELECT class_id FROM student_class)
    ),

    total_paid AS (
      SELECT COALESCE(SUM(amount_paid), 0) AS total 
      FROM fee_payments
      WHERE student_id = $1
    ),

    calculated_totals AS (
      SELECT 
        (SELECT total FROM class_dues) AS total_dues,
        (SELECT total FROM total_paid) AS total_paid
    )

    SELECT 
      ct.total_dues::NUMERIC,
      ct.total_paid::NUMERIC,
      (ct.total_dues - ct.total_paid)::NUMERIC AS balance_due,

      -- Extra amount if student overpaid
      CASE
        WHEN (ct.total_dues - ct.total_paid) < 0 
        THEN (ct.total_paid - ct.total_dues)::NUMERIC
        ELSE 0::NUMERIC
      END AS extra_amount

    FROM calculated_totals ct;
  `;

  try {
    const { rows } = await pool.query(query, [studentId]);
    if (!rows[0]) return res.status(404).json({ error: "Student not found." });
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Get Student Dues Error:", err);
    if (err.code === "42P01") {
      console.error(
        "Database table not found. Check that required tables exist (student, classes, fee_types, fee_payments)."
      );
      return res
        .status(500)
        .json({ error: "Internal server error, table not found." });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- 3. RECORD A NEW PAYMENT (Validation unchanged) ---
router.post("/", async (req, res) => {
  const { student_id, amount_paid, payment_mode } = req.body;

  // Validate amount_paid before inserting
  if (!amount_paid || parseFloat(amount_paid) <= 0) {
    return res.status(400).json({
      error: "Payment amount must be a positive number.",
    });
  }

  if (!student_id || !payment_mode) {
    return res.status(400).json({
      error: "student_id and payment_mode are required.",
    });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO fee_payments (student_id, amount_paid, payment_mode)
       VALUES ($1, $2, $3) RETURNING *`,
      [student_id, amount_paid, payment_mode]
    );

    res
      .status(201)
      .json({ message: "Payment recorded successfully", payment: rows[0] });
  } catch (err) {
    console.error("Record Payment Error:", err);
    if (err.code === "23503")
      return res.status(404).json({ error: "Student not found." });
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- 4. GET DUES REPORT FOR ALL STUDENTS (Transport removed) ---
router.get("/report", async (req, res) => {
  const { student_name, class_id } = req.query;
  const values = [];
  let paramIndex = 1;

  let query = `
    SELECT
      s.id AS student_id,
      s.student_name,
      c.standard || ' ' || c.division AS class,
      COALESCE(cf.total_dues, 0)::NUMERIC AS total_dues,
      COALESCE(sp.total_paid, 0)::NUMERIC AS paid,
      (COALESCE(cf.total_dues, 0) - COALESCE(sp.total_paid, 0))::NUMERIC AS balance,
      CASE
        WHEN (COALESCE(cf.total_dues, 0) - COALESCE(sp.total_paid, 0)) <= 0 AND COALESCE(cf.total_dues, 0) > 0 THEN 'Paid'
        WHEN COALESCE(sp.total_paid, 0) = 0 AND COALESCE(cf.total_dues, 0) > 0 THEN 'Unpaid'
        WHEN COALESCE(cf.total_dues, 0) = 0 THEN 'No Dues'
        ELSE 'Partial'
      END AS status
    FROM student s
    JOIN classes c ON s.class_id = c.id
    LEFT JOIN (
      SELECT class_id, SUM(amount) AS total_dues
      FROM fee_types
      GROUP BY class_id
    ) AS cf ON s.class_id = cf.class_id
    LEFT JOIN (
      SELECT student_id, SUM(amount_paid) AS total_paid
      FROM fee_payments
      GROUP BY student_id
    ) AS sp ON s.id = sp.student_id
    WHERE 1=1
  `;

  if (student_name) {
    query += ` AND s.student_name ILIKE $${paramIndex}`;
    values.push(`%${student_name}%`);
    paramIndex++;
  }

  if (class_id) {
    query += ` AND s.class_id = $${paramIndex}`;
    values.push(class_id);
    paramIndex++;
  }

  query += " ORDER BY c.standard, c.division, s.student_name;";

  try {
    const { rows } = await pool.query(query, values);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Dues Report Error:", err);
    // If there's a missing table, log a clearer message
    if (err.code === "42P01") {
      console.error(
        "Database table not found. Ensure student, classes, fee_types, fee_payments exist."
      );
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
