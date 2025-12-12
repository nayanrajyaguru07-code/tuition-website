const express = require("express");
const pool = require("../../connections/DB.connect.js");

const router = express.Router();

// --- GET TIMETABLE FOR A SPECIFIC CLASS (for students) ---
/**
 * @route   GET /api/timetable/class/:classId
 * @desc    Get the complete weekly timetable for a single class
 * @access  Public / Student
 */
router.get("/class/:classId", async (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    if (isNaN(classId)) {
      return res.status(400).json({ error: "Invalid Class ID." });
    }

    // The query joins all necessary tables and returns period_id + class_id
    const timetable = await pool.query(
      `
      SELECT 
        t.id AS timetable_id,
        t.class_id AS class_id,
        p.id AS period_id,
        p.day,
        p.period_number,
        p.start_time,
        p.end_time,
        s.subject_name,
        f.f_name,
        f.l_name
      FROM timetable t
      JOIN periods p ON t.period_id = p.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN faculty f ON t.faculty_id = f.id
      WHERE t.class_id = $1
      ORDER BY 
        CASE p.day
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
        END,
        p.period_number;
    `,
      [classId]
    );

    if (timetable.rows.length === 0) {
      return res.status(404).json({
        error:
          "Timetable not found for this class. It may not be scheduled yet.",
      });
    }

    res.status(200).json(timetable.rows);
  } catch (err) {
    console.error("Get Class Timetable Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatTime12Hour(timeString) {
  // e.g., timeString = "23:30:00"
  if (!timeString) return "";

  const [hours, minutes] = timeString.split(":");
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }); // Output will be "11:30 PM"
}

// --- GET TIMETABLE FOR A SPECIFIC FACULTY MEMBER (for faculty) ---
/**
 * @route   GET /api/timetable/faculty/:facultyId
 * @desc    Get the complete weekly schedule for a single faculty member
 * @access  Private / Faculty
 */
router.get("/faculty/:facultyId", async (req, res) => {
  try {
    const facultyId = parseInt(req.params.facultyId);
    if (isNaN(facultyId)) {
      return res.status(400).json({ error: "Invalid Faculty ID." });
    }

    const schedule = await pool.query(
      `
      SELECT 
        t.id AS timetable_id,
        t.class_id AS class_id,
        p.id AS period_id,
        p.day,
        p.period_number,
        p.start_time,
        p.end_time,
        s.subject_name,
        c.standard,
        c.division
      FROM timetable t
      JOIN periods p ON t.period_id = p.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN classes c ON t.class_id = c.id
      WHERE t.faculty_id = $1
      ORDER BY 
        CASE p.day
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
        END,
        p.period_number;
    `,
      [facultyId]
    );

    if (schedule.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Schedule not found for this faculty member." });
    }

    res.status(200).json(schedule.rows);
  } catch (err) {
    console.error("Get Faculty Schedule Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
