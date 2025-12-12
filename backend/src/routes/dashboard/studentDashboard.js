const express = require("express");
const pool = require("../../connections/DB.connect.js");

const router = express.Router();

// --- Middleware to get student info, used by subsequent routes ---
const getStudentInfo = async (req, res, next) => {
  const { studentId } = req.params;
  if (isNaN(parseInt(studentId))) {
    return res.status(400).json({ error: "Invalid Student ID." });
  }

  let client;
  try {
    client = await pool.connect();
    const studentResult = await client.query(
      "SELECT id, class_id FROM student WHERE id = $1 AND status = 'Active'",
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: "Student not found." });
    }

    req.student = { id: studentId, class_id: studentResult.rows[0].class_id };
    next();
  } catch (err) {
    console.error("Get Student Info Middleware Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// --- ROUTE 1: GET TODAY'S SCHEDULE ---
router.get("/:studentId/schedule", getStudentInfo, async (req, res) => {
  const { class_id } = req.student;
  let client;
  try {
    client = await pool.connect();
    const holidayCheck = await client.query(
      "SELECT name FROM holidays WHERE CURRENT_DATE BETWEEN start_date AND end_date LIMIT 1"
    );

    if (holidayCheck.rows.length > 0) {
      return res
        .status(200)
        .json({ status: "Holiday", message: holidayCheck.rows[0].name });
    }

    const dayResult = await client.query(
      "SELECT TRIM(TO_CHAR(NOW(), 'Day')) as day"
    );
    const today = dayResult.rows[0].day;

    if (today === "Sunday") {
      return res
        .status(200)
        .json({ status: "Holiday", message: "Today is Sunday." });
    }

    const { rows } = await client.query(
      `
            SELECT 
                TO_CHAR(p.start_time, 'HH24:MI') AS time,
                s.subject_name,
                f.f_name || ' ' || f.l_name AS faculty
            FROM timetable t
            JOIN periods p ON t.period_id = p.id
            JOIN subjects s ON t.subject_id = s.id
            JOIN faculty f ON t.faculty_id = f.id
            WHERE t.class_id = $1 AND p.day = $2::school_day
            ORDER BY p.start_time;
        `,
      [class_id, today]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Today's Schedule Error:", err);
    if (err.code === "22P02") {
      return res.status(500).json({
        error: "There was a configuration error with the school day schedule.",
      });
    }
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// --- ROUTE 2: GET ATTENDANCE DATA (Overall and Trend) ---
router.get("/:studentId/attendance", getStudentInfo, async (req, res) => {
  const { id } = req.student;
  let client;
  try {
    client = await pool.connect();
    const [overall, trend] = await Promise.all([
      // CORRECTED QUERY: Calculates the average of the last 5 monthly percentages.
      client.query(
        `
                WITH monthly_attendance AS (
                    SELECT
                        COALESCE(
                            ROUND(
                                (
                                    COUNT(da.*) FILTER (WHERE LOWER(TRIM(da.status)) = 'present')::DECIMAL
                                    / NULLIF(COUNT(da.*), 0)
                                ) * 100, 2
                            ), 0
                        ) AS monthly_percentage
                    FROM generate_series(
                        date_trunc('month', NOW() - interval '4 months'),
                        date_trunc('month', NOW()),
                        '1 month'
                    ) AS month_series
                    LEFT JOIN daily_attendance da
                        ON da.student_id = $1
                       AND date_trunc('month', da.attendance_date) = month_series
                    GROUP BY month_series
                )
                SELECT COALESCE(ROUND(AVG(monthly_percentage), 2), 0) AS percentage FROM monthly_attendance;
            `,
        [id]
      ),
      // The trend query remains the same as it was already correct.
      client.query(
        `
                SELECT
                    TO_CHAR(month_series, 'Mon') AS month,
                    COALESCE(ROUND((COUNT(da.*) FILTER (WHERE LOWER(TRIM(da.status)) = 'present')::DECIMAL / NULLIF(COUNT(da.*), 0)) * 100, 2), 0) AS percentage
                FROM generate_series(date_trunc('month', NOW() - interval '4 months'), date_trunc('month', NOW()), '1 month') AS month_series
                LEFT JOIN daily_attendance da ON da.student_id = $1 AND date_trunc('month', da.attendance_date) = month_series
                GROUP BY month_series ORDER BY month_series;
            `,
        [id]
      ),
    ]);

    res.status(200).json({
      overall_attendance: parseFloat(overall.rows[0]?.percentage) || 0,
      attendance_trend: trend.rows,
    });
  } catch (err) {
    console.error("Get Attendance Data Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// --- ROUTE 4: GET FEE STATUS (UPDATED TO INCLUDE TRANSPORT FEES) ---
router.get("/:studentId/fees", getStudentInfo, async (req, res) => {
  const { id, class_id } = req.student;
  let client;
  try {
    client = await pool.connect();
    const { rows } = await client.query(
      `
        WITH total_dues AS (
        SELECT
            (SELECT COALESCE(SUM(amount), 0) FROM fee_types WHERE class_id = $1) AS value
    ), total_paid AS (
        SELECT COALESCE(SUM(amount_paid), 0) AS value FROM fee_payments WHERE student_id = $2
    )
    SELECT 
        (SELECT value FROM total_dues) AS total_dues,
        (SELECT value FROM total_paid) AS total_paid,
        ((SELECT value FROM total_dues) - (SELECT value FROM total_paid)) AS balance_due
    FROM total_dues, total_paid;
        `,
      [class_id, id]
    );

    const feeData = rows[0];
    res.status(200).json({
      total_dues: parseFloat(feeData.total_dues) || 0,
      total_paid: parseFloat(feeData.total_paid) || 0,
      balance_due: parseFloat(feeData.balance_due) || 0,
      status:
        parseFloat(feeData.balance_due) <= 0 &&
          parseFloat(feeData.total_dues) > 0
          ? "Paid"
          : "Due",
    });
  } catch (err) {
    console.error("Get Fee Status Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// --- ROUTE 1: GET SUMMARY CARDS (Overall Grade & Upcoming Exams) ---
router.get("/:studentId/summary", getStudentInfo, async (req, res) => {
  const { id, class_id } = req.student;
  let client;
  try {
    client = await pool.connect();
    const [overallGrade, upcomingExams] = await Promise.all([
      // Calculate overall average percentage
      client.query(
        `
                SELECT ROUND(AVG(em.marks_obtained * 100 / es.total_marks), 2) AS percentage
                FROM exam_marks em
                JOIN exam_schedule es ON em.exam_schedule_id = es.id
                WHERE em.student_id = $1 AND em.marks_obtained >= 0;
            `,
        [id]
      ),
      // Count upcoming exams for the student's class
      client.query(
        `
                SELECT COUNT(*) FROM exam_schedule WHERE class_id = $1 AND exam_date >= CURRENT_DATE;
            `,
        [class_id]
      ),
    ]);

    res.status(200).json({
      overall_grade: parseFloat(overallGrade.rows[0]?.percentage) || 0,
      upcoming_exams_count: parseInt(upcomingExams.rows[0]?.count, 10) || 0,
    });
  } catch (err) {
    console.error("Get Summary Cards Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

// --- ROUTE 2: GET RECENT & SUBJECT PERFORMANCE (Line and Radar Charts) ---
router.get("/:studentId/performance", getStudentInfo, async (req, res) => {
  const { id } = req.student;
  let client;
  try {
    client = await pool.connect();
    const [recent, subject] = await Promise.all([
      // Get the 5 most recent exam scores
      client.query(
        `
                SELECT 
                    es.exam_name || ' (' || s.subject_name || ')' AS label,
                    (em.marks_obtained * 100 / es.total_marks) AS score
                FROM exam_marks em
                JOIN exam_schedule es ON em.exam_schedule_id = es.id
                JOIN subjects s ON es.subject_id = s.id
                WHERE em.student_id = $1 AND em.marks_obtained >= 0
                ORDER BY es.exam_date DESC
                LIMIT 5;
            `,
        [id]
      ),
      // Get average score per subject for the radar chart
      client.query(
        `
                SELECT 
                    s.subject_name,
                    ROUND(AVG(em.marks_obtained * 100 / es.total_marks), 2) AS average_score
                FROM exam_marks em
                JOIN exam_schedule es ON em.exam_schedule_id = es.id
                JOIN subjects s ON es.subject_id = s.id
                WHERE em.student_id = $1 AND em.marks_obtained >= 0
                GROUP BY s.subject_name;
            `,
        [id]
      ),
    ]);

    res.status(200).json({
      recent_performance: recent.rows.reverse(), // Reverse to show chronologically on the chart
      subject_performance: subject.rows,
    });
  } catch (err) {
    console.error("Get Performance Data Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

// --- ROUTE 3: GET UPCOMING EVENTS ---
router.get("/:studentId/upcoming-events", getStudentInfo, async (req, res) => {
  const { class_id } = req.student;
  let client;
  try {
    client = await pool.connect();
    // This query now ONLY fetches from the 'events' table.
    const query = `
            SELECT 
                title, 
                description,
                event_date AS date,
                TO_CHAR(event_time, 'HH24:MI') AS time
            FROM events
            WHERE (class_id IS NULL OR class_id = $1) AND event_date >= CURRENT_DATE
            ORDER BY date, time
            LIMIT 5;
        `;
    const { rows } = await client.query(query, [class_id]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Upcoming Events Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

// --- NEW ROUTE 4: GET UPCOMING ANNOUNCEMENTS (EXAMS) ---
router.get(
  "/:studentId/upcoming-announcements",
  getStudentInfo,
  async (req, res) => {
    const { class_id } = req.student;
    let client;
    try {
      client = await pool.connect();
      // This query now ONLY fetches from the 'exam_schedule' table.
      const query = `
            SELECT 
                exam_name || ' - ' || s.subject_name AS title,
                'Total Marks: ' || total_marks AS description,
                exam_date AS date,
                TO_CHAR(start_time, 'HH24:MI') AS time
            FROM exam_schedule es
            JOIN subjects s ON es.subject_id = s.id
            WHERE es.class_id = $1 AND es.exam_date >= CURRENT_DATE
            ORDER BY date, time
            LIMIT 5;
        `;
      const { rows } = await client.query(query, [class_id]);
      res.status(200).json(rows);
    } catch (err) {
      console.error("Get Upcoming Announcements Error:", err);
      res.status(500).json({ error: "Internal server error" });
    } finally {
      if (client) client.release();
    }
  }
);

// --- *** ADDED NEW ROUTE *** ---
// --- ROUTE 5: GET ALL EXAM RESULTS (Report Card) ---
router.get("/:studentId/exam-results", getStudentInfo, async (req, res) => {
  const { id } = req.student; // Get student ID from middleware
  const { exam_name, date } = req.query; // Get optional filters
  let client;

  let query = `
    SELECT 
        es.exam_date,
        es.exam_name,
        s.subject_name,
        em.marks_obtained,
        es.total_marks,
        ROUND((em.marks_obtained * 100.0 / es.total_marks), 2) AS percentage
    FROM exam_marks em
    JOIN exam_schedule es ON em.exam_schedule_id = es.id
    JOIN subjects s ON es.subject_id = s.id
    WHERE em.student_id = $1 AND em.marks_obtained >= 0
  `;

  const values = [id];
  let paramIndex = 2; // Start at $2

  if (exam_name) {
    query += ` AND es.exam_name = $${paramIndex}`;
    values.push(exam_name);
    paramIndex++;
  }

  if (date) {
    query += ` AND es.exam_date = $${paramIndex}`;
    values.push(date);
    paramIndex++;
  }

  query += ` ORDER BY es.exam_date DESC, es.exam_name;`;

  try {
    client = await pool.connect();
    const { rows } = await client.query(query, values);
    res.status(200).json(rows); // Send the full list of results
  } catch (err) {
    console.error("Get Exam Results Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});
// --- *** END OF NEW ROUTE *** ---

router.get("/student-report/:studentId", async (req, res) => {
  const { studentId } = req.params;
  let client;

  try {
    client = await pool.connect();

    const query = `
      WITH subject_stats AS (
        -- Step 1: Calculate performance per subject
        SELECT 
          s.subject_name,
          COALESCE(SUM(em.marks_obtained), 0) as obtained,
          COALESCE(SUM(es.total_marks), 0) as total,
          CASE 
            WHEN SUM(es.total_marks) > 0 THEN 
              ROUND((SUM(em.marks_obtained)::numeric / SUM(es.total_marks)) * 100, 2)
            ELSE 0 
          END as percentage
        FROM exam_marks em
        JOIN exam_schedule es ON em.exam_schedule_id = es.id
        JOIN subjects s ON es.subject_id = s.id
        WHERE em.student_id = $1
        GROUP BY s.subject_name
      ),
      overall_stats AS (
        -- Step 2: Calculate overall performance across all subjects
        SELECT 
          COALESCE(SUM(obtained), 0) as total_obtained,
          COALESCE(SUM(total), 0) as total_possible,
          CASE 
            WHEN SUM(total) > 0 THEN 
              ROUND((SUM(obtained)::numeric / SUM(total)) * 100, 2)
            ELSE 0 
          END as overall_percentage
        FROM subject_stats
      )
      -- Step 3: Combine everything including STUDENT NAME into a single JSON
      SELECT 
        json_build_object(
          'student_id', $1::int,
          'student_name', (SELECT student_name FROM student WHERE id = $1), -- <--- ADDED THIS LINE
          'overall', (SELECT row_to_json(overall_stats) FROM overall_stats),
          'subjects', (SELECT json_agg(subject_stats) FROM subject_stats)
        ) as report;
    `;

    const { rows } = await client.query(query, [studentId]);

    const report = rows[0]?.report || {};

    // Check if student exists (if name is null, the ID is invalid)
    if (!report.student_name) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Handle case where student exists but has no exam data yet
    if (!report.subjects) {
      report.subjects = [];
      report.overall = { total_obtained: 0, total_possible: 0, overall_percentage: 0 };
    }

    res.status(200).json(report);

  } catch (err) {
    console.error("Complete Student Report Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

router.get("/attendance/status", async (req, res) => {
  const { studentId, date } = req.query; 
  let client;

  if (!studentId || !date) {
    return res.status(400).json({ error: "Please provide studentId and date" });
  }

  try {
    client = await pool.connect();

    const query = `
      SELECT 
        s.student_name,
        s.gr_no,
        -- Combine standard and division (e.g., "10-A")
        c.standard || '-' || c.division AS class_details,
        da.status,
        da.remarks
      FROM student s
      JOIN classes c ON s.class_id = c.id
      -- LEFT JOIN ensures we get student details even if no attendance exists for this date
      LEFT JOIN daily_attendance da ON s.id = da.student_id AND da.attendance_date = $2
      WHERE s.id = $1
    `;

    const { rows } = await client.query(query, [studentId, date]);

    if (rows.length === 0) {
      // If no rows returned, the student_id itself is invalid
      return res.status(404).json({ error: "Student not found" });
    }

    const data = rows[0];

    // Prepare the response
    // If da.status is null (because of LEFT JOIN), it means attendance isn't marked yet.
    const response = {
      student_name: data.student_name,
      gr_no: data.gr_no,
      class: data.class_details,
      status: data.status || "Not Marked", // Default if no record exists
      remark: data.remarks || ""           // Default to empty string if null
    };

    res.status(200).json(response);

  } catch (err) {
    console.error("Get Attendance Status Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

router.get("/attendance/monthly-report", async (req, res) => {
  const { studentId, month, year } = req.query; 
  let client;

  // Validate inputs
  if (!studentId || !month || !year) {
    return res.status(400).json({ error: "Please provide studentId, month, and year" });
  }

  try {
    client = await pool.connect();

    const query = `
      SELECT 
        -- Format date as 'YYYY-MM-DD' for easy frontend parsing
        TO_CHAR(attendance_date, 'YYYY-MM-DD') as date,
        status,
        remarks
      FROM daily_attendance 
      WHERE 
        student_id = $1 
        AND EXTRACT(MONTH FROM attendance_date) = $2 
        AND EXTRACT(YEAR FROM attendance_date) = $3
      ORDER BY attendance_date ASC
    `;

    const { rows } = await client.query(query, [studentId, month, year]);

    // Return the list of days where attendance was marked.
    // The frontend can assume any date missing from this list is "Not Marked" or a holiday.
    res.status(200).json(rows);

  } catch (err) {
    console.error("Get Monthly Attendance Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
