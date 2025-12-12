const express = require("express");
const pool = require("../../connections/DB.connect.js");

const router = express.Router();

// --- ROUTE 1: GET SUMMARY CARDS ---
router.get("/summary-cards", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const [summary] = await Promise.all([
      client.query(`
                SELECT
                    (SELECT COUNT(*) FROM student WHERE status = 'Active') AS total_students,
                    (SELECT COUNT(*) FROM faculty) AS total_teachers,
                    (SELECT COUNT(*) FROM student WHERE admission_date >= date_trunc('month', NOW())) AS new_admissions_this_month
            `),
    ]);
    res.status(200).json({
      students: parseInt(summary.rows[0].total_students, 10),
      teachers: parseInt(summary.rows[0].total_teachers, 10),
      admissions: parseInt(summary.rows[0].new_admissions_this_month, 10),
    });
  } catch (err) {
    console.error("Get Summary Cards Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

// --- ROUTE 2: GET GENDER DISTRIBUTION ---
router.get("/gender-distribution", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { rows } = await client.query(`
            SELECT 
                COALESCE(gender, 'Other') as gender, 
                COUNT(*) as count 
            FROM student 
            WHERE status = 'Active' 
            GROUP BY gender;
        `);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Gender Distribution Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

// --- ROUTE 3: GET 7-DAY ATTENDANCE REPORT ---
router.get("/attendance-report", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { rows } = await client.query(`
            SELECT 
                TO_CHAR(d.day, 'Dy') as day,
                COALESCE(a.present, 0) as present,
                COALESCE(a.absent, 0) as absent
            FROM (
                SELECT generate_series(CURRENT_DATE - interval '6 days', CURRENT_DATE, '1 day')::date AS day
            ) d
            LEFT JOIN (
                SELECT 
                    attendance_date, 
                    COUNT(*) FILTER (WHERE status = 'Present') as present,
                    COUNT(*) FILTER (WHERE status = 'Absent') as absent
                FROM daily_attendance
                WHERE attendance_date >= CURRENT_DATE - interval '6 days'
                GROUP BY attendance_date
            ) a ON d.day = a.attendance_date
            ORDER BY d.day;
        `);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Attendance Report Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

// --- ROUTE 4: GET CLASS-WISE PERFORMANCE ---
router.get("/class-performance", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { rows } = await client.query(`
            SELECT 
                c.standard || ' - ' || c.division AS class_name,
                ROUND(AVG(em.marks_obtained * 100 / es.total_marks), 2) AS average_percentage
            FROM exam_marks em
            JOIN exam_schedule es ON em.exam_schedule_id = es.id
            JOIN student s ON em.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            WHERE em.marks_obtained >= 0
            GROUP BY class_name
            ORDER BY class_name;
        `);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Class Performance Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

// --- ROUTE 5: GET MONTHLY INCOME REPORT ---
router.get("/income-report", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { rows } = await client.query(`
            SELECT 
                TO_CHAR(month_series, 'Mon') AS month,
                COALESCE(p.total_paid, 0) as income
            FROM generate_series(
                date_trunc('year', NOW()),
                date_trunc('year', NOW()) + interval '11 months',
                '1 month'
            ) AS month_series
            LEFT JOIN (
                SELECT 
                    date_trunc('month', payment_date) as month, 
                    SUM(amount_paid) as total_paid 
                FROM fee_payments 
                GROUP BY month
            ) p ON month_series = p.month
            ORDER BY month_series;
        `);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Income Report Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

// --- ROUTE 6: GET FACULTY PERFORMANCE ---
router.get("/faculty-performance", async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    // Since you added faculty_id to exam_schedule, we don't need the complex WITH clause (CTE) anymore.
    // We can join exam_marks directly to exam_schedule, and then to faculty.
    const { rows } = await client.query(`
        SELECT 
            f.f_name || ' ' || f.l_name AS faculty_name,
            -- Calculate percentage: (marks obtained / total marks) * 100
            ROUND(AVG(em.marks_obtained * 100.0 / es.total_marks), 2) AS average_score
        FROM exam_marks em
        JOIN exam_schedule es ON em.exam_schedule_id = es.id
        JOIN faculty f ON es.faculty_id = f.id
        WHERE em.marks_obtained >= 0 
        GROUP BY f.id, f.f_name, f.l_name
        ORDER BY average_score DESC;
    `);

    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Faculty Performance Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

// --- NEW ROUTE 7: GET UPCOMING EVENTS & MEETINGS ---
/**
 * @route   GET /api/admin-dashboard/upcoming-events
 * @desc    Get a consolidated list of upcoming school events and meetings.
 * @access  Private (Admin)
 */
router.get("/upcoming-events", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    // This query combines events and meetings into a single, ordered list.
    const query = `
    SELECT 
        'Event' AS type,
        title, 
        description,
        event_date AS date,
        TO_CHAR(event_time, 'HH24:MI') AS time
    FROM events
    WHERE event_date >= CURRENT_DATE
    ORDER BY date, time
    LIMIT 5;
`;
    const { rows } = await client.query(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Upcoming Events Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

router.get("/upcoming-exams", async (req, res) => {
  try {
    const { rows } = await pool.query(`
            SELECT 
                es.id,
                es.exam_name,
                c.standard || ' ' || c.division AS class_name, 
                s.subject_name,
                es.exam_date,
                TO_CHAR(es.start_time, 'hh12:MI AM') AS start_time,
                es.total_marks,
                es.class_id, -- Include class_id if needed for frontend filtering/linking
                es.subject_id -- Include subject_id if needed
            FROM exam_schedule es
            JOIN classes c ON es.class_id = c.id
            JOIN subjects s ON es.subject_id = s.id
            ORDER BY c.standard, c.division, es.exam_name, es.exam_date, es.start_time; 
        `);

    res.status(200).json(rows); // Return the flat array of results
  } catch (err) {
    console.error("Get All Exams Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- ADDED: Faculty Attendance Report (Last 7 Days) ---
/**
 * @route   GET /api/attendance/faculty-attendance-report
 * @desc    Get a 7-day aggregated attendance report for all faculty
 * @access  Private (Admin)
 */
router.get("/faculty-attendance-report", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    // This query mirrors your student report but queries the faculty_attendance table
    // and counts all the faculty-specific statuses.
    const { rows } = await client.query(`
      SELECT 
        TO_CHAR(d.day, 'Dy') as day,
        COALESCE(a.present, 0) as present,
        COALESCE(a.absent, 0) as absent,
        COALESCE(a.leave, 0) as leave,
        COALESCE(a.half_day, 0) as half_day,
        COALESCE(a.on_duty, 0) as on_duty
      FROM (
        -- 1. Generate a series for the last 7 days (including today)
        SELECT generate_series(CURRENT_DATE - interval '6 days', CURRENT_DATE, '1 day')::date AS day
      ) d
      LEFT JOIN (
        -- 2. Get the daily counts for each status from faculty_attendance
        SELECT 
          attendance_date, 
          COUNT(*) FILTER (WHERE status = 'Present') as present,
          COUNT(*) FILTER (WHERE status = 'Absent') as absent,
          COUNT(*) FILTER (WHERE status = 'Leave') as leave,
          COUNT(*) FILTER (WHERE status = 'Half Day') as half_day,
          COUNT(*) FILTER (WHERE status = 'On Duty') as on_duty
        FROM faculty_attendance
        WHERE attendance_date >= CURRENT_DATE - interval '6 days'
        GROUP BY attendance_date
      ) a ON d.day = a.attendance_date
      ORDER BY d.day;
    `);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Faculty Attendance Report Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
