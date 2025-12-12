const express = require('express');
const pool = require('../../connections/DB.connect.js');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [classes, subjects] = await Promise.all([
            pool.query('SELECT id, standard, division FROM classes ORDER BY standard, division'),
            pool.query('SELECT id, subject_name FROM subjects ORDER BY subject_name'),
        ]);

        res.status(200).json({
            classes: classes.rows,
            subjects: subjects.rows,
        });
    } catch (err) {
        console.error('Get Timetable Form Data Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- NEW ROUTE: GET ALL EXAMS FOR A SPECIFIC CLASS AND SUBJECT ---
/**
 * @route   GET /api/exams/class/:classId/subject/:subjectId
 * @desc    Get all exam details for a specific subject within a specific class (e.g., all Math exams for Class 10-A)
 * @access  Private (Students, Faculty, Parents)
 */
router.get('/class/:classId/subject/:subjectId', async (req, res) => {
    const { classId, subjectId } = req.params;

    // Input validation
    if (isNaN(parseInt(classId)) || isNaN(parseInt(subjectId))) {
        return res.status(400).json({ error: 'Invalid Class ID or Subject ID. Both must be numbers.' });
    }

    try {
        const { rows } = await pool.query(`
            SELECT 
                es.id,
                es.exam_name,
                c.standard,
                c.division,
                s.subject_name,
                es.exam_date,
                TO_CHAR(es.start_time, 'hh12:MI AM') AS start_time,
                es.total_marks
            FROM exam_schedule es
            JOIN subjects s ON es.subject_id = s.id
            JOIN classes c ON es.class_id = c.id
            WHERE es.class_id = $1 AND es.subject_id = $2
            ORDER BY es.exam_date ASC; -- Order chronologically
        `, [classId, subjectId]);

        // It's better to return an empty array if no exams are found
        // than a 404, as it's a valid query with no results.
        res.status(200).json(rows);

    } catch (err) {
        console.error('Get Subject-wise Exams Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;