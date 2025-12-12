const express = require("express");
const pool = require("../../connections/DB.connect.js");

const router = express.Router();

// --- ENTER OR UPDATE MARKS (HANDLES 'null' for ABSENT) ---
/**
 * @route   POST /api/marks
 * @desc    Enter/update marks. Translates `null` marks to -1 for storage.
 * @access  Private (Faculty/Admin)
 * @body    { "exam_schedule_id": 1, "marks_data": [ { "student_id": 4, "marks": 22 }, { "student_id": 6, "marks": null } ] }
 */
router.post("/", async (req, res) => {
  const { exam_schedule_id, marks_data } = req.body;

  if (
    !exam_schedule_id ||
    !Array.isArray(marks_data) ||
    marks_data.length === 0
  ) {
    return res.status(400).json({
      error: "exam_schedule_id and a non-empty marks_data array are required.",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN"); // Start transaction

    const upsertQuery = `
            INSERT INTO exam_marks (exam_schedule_id, student_id, marks_obtained)
            VALUES ($1, $2, $3)
            ON CONFLICT (exam_schedule_id, student_id)
            DO UPDATE SET
                marks_obtained = EXCLUDED.marks_obtained,
                updated_at = NOW();
        `;

    for (const record of marks_data) {
      const { student_id, marks } = record;

      // --- CORE LOGIC: Translate null to -1 ---
      // If marks are null or undefined, store -1. Otherwise, store the actual marks.
      let marksToStore;
      if (
        marks == null ||
        isNaN(Number(marks))
      ) {
        marksToStore = null; // store NULL
      } else {
        marksToStore = parseInt(marks, 10);
      }
      //

      await client.query(upsertQuery, [
        exam_schedule_id,
        student_id,
        marksToStore,
      ]);
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Marks have been successfully saved." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Mark Entry Error:", err);
    res
      .status(500)
      .json({ error: "Failed to save marks. An internal error occurred." });
  } finally {
    client.release();
  }
});

// --- GET ALL EXAM MARKS FOR A SINGLE STUDENT (Handles "Absent") ---
/**
 * @route   GET /api/marks/student/:studentId
 * @desc    Get a report card, converting -1 marks to 'Absent'.
 * @access  Private
 */
router.get("/student/:studentId", async (req, res) => {
  const { studentId } = req.params;
  try {
    const { rows } = await pool.query(
      `
            SELECT 
                s.student_name,
                es.exam_name,
                sub.subject_name,
                es.exam_date,
                es.total_marks,
                em.marks_obtained,
                -- CORE LOGIC: Translate -1 back to a display-friendly string
                CASE
                  WHEN em.marks_obtained = -1 THEN 'Absent'
                  ELSE CAST(em.marks_obtained AS TEXT)
                  END AS result
            FROM exam_marks em
            JOIN exam_schedule es ON em.exam_schedule_id = es.id
            JOIN student s ON em.student_id = s.id
            -- CORRECTED JOIN CONDITION BELOW
            JOIN subjects sub ON sub.id = es.subject_id
            WHERE em.student_id = $1
            ORDER BY es.exam_date DESC;
        `,
      [studentId]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Student Marks Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- GET ALL STUDENT MARKS FOR A SINGLE EXAM (Handles "Absent") ---
/**
 * @route   GET /api/marks/exam/:examScheduleId
 * @desc    Get the result sheet, converting -1 marks to 'Absent'.
 * @access  Private
 */
router.get("/exam/:examScheduleId", async (req, res) => {
  const { examScheduleId } = req.params;
  try {
    const { rows } = await pool.query(
      `
            SELECT 
                s.student_name,
                s.gr_no,
                es.total_marks,
                -- CORE LOGIC: Translate -1 back to a display-friendly string
                CASE 
                    WHEN em.marks_obtained = -1 THEN 'Absent'
                    ELSE CAST(em.marks_obtained AS TEXT)
                END AS result
            FROM exam_marks em
            JOIN student s ON em.student_id = s.id
            JOIN exam_schedule es ON em.exam_schedule_id = es.id
            WHERE em.exam_schedule_id = $1
            ORDER BY s.student_name;
        `,
      [examScheduleId]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Exam Marks Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
