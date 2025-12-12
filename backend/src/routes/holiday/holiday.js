const express = require('express');
const pool = require('../../connections/DB.connect.js');

const router = express.Router();

// --- CREATE A NEW HOLIDAY ---
/**
 * @route   POST /api/holidays
 * @desc    Create a new holiday. Handles single vs. multi-day implicitly.
 * @access  Private (Admin)
 * @body    { "name": "Diwali", "start_date": "2025-10-21" } OR { "name": "Summer Vacation", "start_date": "2025-05-01", "end_date": "2025-06-05" }
 */
router.post('/', async (req, res) => {
    // If end_date is not provided, it defaults to the start_date, creating a single-day holiday.
    const { name, start_date, end_date = start_date } = req.body;

    // --- Validation ---
    if (!name || !start_date) {
        return res.status(400).json({ error: 'name and start_date are required.' });
    }

    try {
        const newHoliday = await pool.query(
            `INSERT INTO holidays (name, start_date, end_date)
             VALUES ($1, $2, $3) RETURNING *`,
            [name, start_date, end_date]
        );
        res.status(201).json({ message: 'Holiday created successfully', holiday: newHoliday.rows[0] });
    } catch (err) {
        console.error('Create Holiday Error:', err);
        // This will catch the CHECK constraint violation if end_date < start_date
        if (err.code === '23514') {
            return res.status(400).json({ error: 'End date cannot be before the start date.' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- GET ALL UPCOMING HOLIDAYS ---
/**
 * @route   GET /api/holidays
 * @desc    Get a list of all upcoming holidays (single days and vacations).
 * @access  Public or Private
 */
router.get('/', async (req, res) => {
    try {
        // This query fetches all holidays where the end_date has not yet passed.
        const { rows } = await pool.query(
            "SELECT * FROM holidays WHERE end_date >= CURRENT_DATE ORDER BY start_date ASC"
        );
        res.status(200).json(rows);
    } catch (err) {
        console.error('Get Holidays Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- UPDATE A HOLIDAY ---
/**
 * @route   PATCH /api/holidays/:id
 * @desc    Update a holiday's details.
 * @access  Private (Admin)
 */
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, start_date, end_date } = req.body;

    const updates = { name, start_date, end_date };
    const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
    
    if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields provided for update.' });
    }

    const setClause = fields.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = fields.map(key => updates[key]);
    values.push(id);

    try {
        const { rows } = await pool.query(
            `UPDATE holidays SET ${setClause} WHERE id = $${values.length} RETURNING *`,
            values
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Holiday not found.' });
        }
        res.status(200).json({ message: 'Holiday updated successfully', holiday: rows[0] });
    } catch (err) {
        console.error('Update Holiday Error:', err);
        if (err.code === '23514') {
            return res.status(400).json({ error: 'End date cannot be before the start date.' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- DELETE A HOLIDAY ---
/**
 * @route   DELETE /api/holidays/:id
 * @desc    Delete a holiday record.
 * @access  Private (Admin)
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM holidays WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Holiday not found.' });
        }
        res.status(200).json({ message: 'Holiday deleted successfully.' });
    } catch (err) {
        console.error('Delete Holiday Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

