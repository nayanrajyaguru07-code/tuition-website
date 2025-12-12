const express = require('express');
const pool = require('../../connections/DB.connect.js');

const router = express.Router();

/**
 * @route   POST /api/admin/subjects
 * @desc    Admin adds a new subject
 * @access  Private (Admin Only - requires auth middleware)
 */
router.post('/', async (req, res) => {
    const { subject_name } = req.body;

    if (!subject_name) {
        return res.status(400).json({ error: 'subject_name is required.' });
    }

    try {
        // Check if the subject already exists to provide a friendly error
        const existingSubject = await pool.query(
            'SELECT * FROM subjects WHERE subject_name = $1',
            [subject_name]
        );

        if (existingSubject.rows.length > 0) {
            return res.status(409).json({ error: 'This subject already exists.' });
        }

        // Insert the new subject
        const newSubject = await pool.query(
            `INSERT INTO subjects (subject_name) VALUES ($1) RETURNING *`,
            [subject_name]
        );

        res.status(201).json({
            message: 'Subject added successfully.',
            subject: newSubject.rows[0],
        });

    } catch (err) {
        console.error('Add Subject Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
