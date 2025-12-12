const express = require('express');
const pool = require('../../connections/DB.connect.js');

const router = express.Router();


router.post('/', async (req, res) => {
    const { day, period_number, start_time, end_time } = req.body;

    // --- Validation ---
    if (!day || !period_number || !start_time || !end_time) {
        return res.status(400).json({ error: 'day, period_number, start_time, and end_time are required.' });
    }

    // Optional: More specific validation for time format if needed
    // const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/; // 24-hour format HH:MM
    // if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
    //     return res.status(400).json({ error: 'Time must be in HH:MM format.' });
    // }

    try {
        // --- Check for duplicates ---
        const existingPeriod = await pool.query(
            'SELECT * FROM periods WHERE day = $1 AND period_number = $2',
            [day, period_number]
        );

        if (existingPeriod.rows.length > 0) {
            return res.status(409).json({ error: `Period ${period_number} on ${day} already exists.` });
        }

        // --- Insert new period ---
        const newPeriod = await pool.query(
            `INSERT INTO periods (day, period_number, start_time, end_time) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [day, period_number, start_time, end_time]
        );

        res.status(201).json({
            message: 'Period definition added successfully.',
            period: newPeriod.rows[0],
        });

    } catch (err) {
        console.error('Add Period Error:', err);
        // Handle specific DB errors, like invalid ENUM value
        if (err.code === '22P02') {
             return res.status(400).json({ error: `Invalid value for day. Must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.` });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});


/**
 * @route   GET /api/admin/periods
 * @desc    Get all defined periods
 * @access  Private (Admin Only)
 */
router.get('/', async (req, res) => {
    try {
        const periods = await pool.query('SELECT * FROM periods ORDER BY day, period_number');
        res.status(200).json(periods.rows);
    } catch (err) {
        console.error('Get Periods Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;
