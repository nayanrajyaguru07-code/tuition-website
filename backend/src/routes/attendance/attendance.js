const express = require("express");
const pool = require("../../connections/DB.connect.js");

const router = express.Router();

// ==========================================================
// --- STUDENT ATTENDANCE ROUTES ---
// ==========================================================

/**
 * @route   GET /api/attendance/class/:classId/students
 * @desc    Get a grouped and sorted list of students in a class.
 * @access  Private (Faculty/Admin)
 */
router.get("/class/:classId/students", async (req, res) => {
  const { classId } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, student_name, gr_no 
             FROM student 
             WHERE class_id = $1 AND status = 'Active' 
             ORDER BY student_name`,
      [classId]
    );

    const studentsBySurname = {};
    for (const student of result.rows) {
      const surname = student.student_name.split(" ")[0];
      if (!studentsBySurname[surname]) {
        studentsBySurname[surname] = [];
      }
      studentsBySurname[surname].push(student);
    }

    res.status(200).json(studentsBySurname);
  } catch (err) {
    console.error("Get Class Students Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route   POST /api/attendance
 * @desc    Creates or updates attendance for multiple students.
 * @access  Private (Faculty/Admin)
 * @body    { "class_id": 1, "attendance_date": "2025-10-13", "attendance_data": [...] }
 */
router.post("/", async (req, res) => {
  let { class_id, attendance_date, attendance_data } = req.body;

  if (!attendance_date) {
    attendance_date = new Date().toISOString().split("T")[0];
  }

  if (
    !class_id ||
    !Array.isArray(attendance_data) ||
    attendance_data.length === 0
  ) {
    return res.status(400).json({
      error: "class_id and a non-empty attendance_data array are required.",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const query = `
            INSERT INTO daily_attendance (student_id, class_id, attendance_date, status, remarks)
            SELECT 
                (d.student_data->>'student_id')::INTEGER, 
                $1, 
                $2, 
                (d.student_data->>'status')::student_status_enum,
                d.student_data->>'remarks'
            FROM jsonb_array_elements($3::jsonb) AS d(student_data)
            ON CONFLICT (student_id, attendance_date) 
            DO UPDATE SET 
                status = EXCLUDED.status,
                remarks = EXCLUDED.remarks;
        `;

    await client.query(query, [
      class_id,
      attendance_date,
      JSON.stringify(attendance_data),
    ]);

    await client.query("COMMIT");
    res.status(201).json({ message: "Attendance recorded successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Mark Attendance Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

/**
 * @route   GET /api/attendance
 * @desc    Get student attendance records based on query parameters.
 * @access  Private (Faculty/Admin/Parents)
 * @query   ?class_id=1&date=2025-10-13
 */
router.get("/", async (req, res) => {
  const { class_id, date } = req.query;

  try {
    let query = `
            SELECT 
                s.student_name, s.gr_no,
                c.standard, c.division,
                da.attendance_date, da.status, da.remarks
            FROM daily_attendance da
            JOIN student s ON da.student_id = s.id
            JOIN classes c ON da.class_id = c.id
        `;

    const values = [];
    let whereClauses = [];

    if (class_id) {
      values.push(class_id);
      whereClauses.push(`da.class_id = $${values.length}`);
    }
    if (date) {
      values.push(date);
      whereClauses.push(`da.attendance_date = $${values.length}`);
    }

    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    } else {
      return res.status(200).json([]);
    }

    query +=
      " ORDER BY da.attendance_date DESC, c.standard, c.division, s.student_name;";

    const { rows } = await pool.query(query, values);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Attendance Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================================
// --- MODIFIED: FACULTY ATTENDANCE ROUTES ---
// (Using your 'faculty' table)
// ==========================================================

/**
 * @route   GET /api/attendance/faculty/all
 * @desc    Get a list of all faculty for marking attendance.
 * @access  Private (Admin)
 */
// --- MODIFIED: Route changed to /faculty/all ---
router.get("/faculty/all", async (req, res) => {
  try {
    // --- MODIFIED: Query 'faculty' table and get f_name, l_name, role ---
    const result = await pool.query(
      `SELECT 
         id, 
         f_name, 
         l_name, 
         f_name || ' ' || l_name AS full_name, 
         role 
       FROM faculty 
       ORDER BY role, l_name, f_name`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Get All Faculty Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route   POST /api/attendance/faculty
 * @desc    Creates or updates attendance for multiple faculty members.
 * @access  Private (Admin)
 * @body    { "attendance_date": "2025-10-13", "attendance_data": [...] }
 * @body_example attendance_data: [
 * { "faculty_id": 1, "status": "Present", "clock_in": "09:00", "clock_out": "17:00", "remarks": "" },
 * { "faculty_id": 2, "status": "Leave", "remarks": "Sick leave" }
 * ]
 */
// --- MODIFIED: Route changed to /faculty ---
router.post("/faculty", async (req, res) => {
  let { attendance_date, attendance_data } = req.body;

  if (!attendance_date) {
    attendance_date = new Date().toISOString().split("T")[0];
  }

  if (!Array.isArray(attendance_data) || attendance_data.length === 0) {
    return res
      .status(400)
      .json({ error: "A non-empty attendance_data array is required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // --- MODIFIED: Inserts into 'faculty_attendance' and uses 'faculty_id' ---
    const query = `
            INSERT INTO faculty_attendance (
                faculty_id, 
                attendance_date, 
                status, 
                remarks, 
                clock_in_time, 
                clock_out_time
            )
            SELECT 
                (d.faculty_data->>'faculty_id')::INTEGER, 
                $1, 
                (d.faculty_data->>'status')::faculty_status_enum, 
                d.faculty_data->>'remarks',
                (d.faculty_data->>'clock_in')::TIME,
                (d.faculty_data->>'clock_out')::TIME
            FROM jsonb_array_elements($2::jsonb) AS d(faculty_data)
            ON CONFLICT (faculty_id, attendance_date) 
            DO UPDATE SET 
                status = EXCLUDED.status,
                remarks = EXCLUDED.remarks,
                clock_in_time = EXCLUDED.clock_in_time,
                clock_out_time = EXCLUDED.clock_out_time;
        `;

    await client.query(query, [
      attendance_date,
      JSON.stringify(attendance_data),
    ]);

    await client.query("COMMIT");
    res
      .status(201)
      .json({ message: "Faculty attendance recorded successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Mark Faculty Attendance Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

/**
 * @route   GET /api/attendance/faculty
 * @desc    Get faculty attendance records based on query parameters.
 * @access  Private (Admin)
 * @query   ?faculty_id=1&date=2025-10-13   (Specific faculty, specific date)
 * @query   ?date=2025-10-13              (All faculty, specific date)
 * @query   ?faculty_id=1                   (Specific faculty, all dates)
 */
// --- MODIFIED: Route changed to /faculty ---
router.get("/faculty", async (req, res) => {
  // --- MODIFIED: Query param changed to 'faculty_id' ---
  const { faculty_id, date } = req.query;

  try {
    // --- MODIFIED: Joins with 'faculty' table ---
    let query = `
            SELECT 
                f.f_name, f.l_name, f.role,
                fa.attendance_date, fa.status, fa.remarks, 
                fa.clock_in_time, fa.clock_out_time
            FROM faculty_attendance fa
            JOIN faculty f ON fa.faculty_id = f.id
        `;

    const values = [];
    let whereClauses = [];

    // --- MODIFIED: Filter by 'fa.faculty_id' ---
    if (faculty_id) {
      values.push(faculty_id);
      whereClauses.push(`fa.faculty_id = $${values.length}`);
    }
    if (date) {
      values.push(date);
      whereClauses.push(`fa.attendance_date = $${values.length}`);
    }

    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    } else {
      return res.status(200).json([]);
    }

    // --- MODIFIED: Order by faculty role and name ---
    query += " ORDER BY fa.attendance_date DESC, f.role, f.l_name;";

    const { rows } = await pool.query(query, values);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Faculty Attendance Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
