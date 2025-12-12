const express = require('express');
const pool = require('../../connections/DB.connect.js');

const router = express.Router();

// --- CREATE A NEW MEETING ---
/**
 * @route   POST /api/meetings
 * @desc    Schedule a new school meeting
 * @access  Private (Admin)
 * @body    { "title": "Parent-Teacher Meeting", "meeting_date": "2025-11-15", "meeting_time": "10:00", "location": "Class 10-A Room", "description": "Discussing mid-term results." }
 */
router.post('/', async (req, res) => {
    const { title, meeting_date, meeting_time, location, description } = req.body;

    if (!title || !meeting_date || !meeting_time) {
        return res.status(400).json({ error: 'title, meeting_date, and meeting_time are required.' });
    }

    try {
        const newMeeting = await pool.query(
            `INSERT INTO meetings (title, meeting_date, meeting_time, location, description)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [title, meeting_date, meeting_time, location, description]
        );
        res.status(201).json({ message: 'Meeting scheduled successfully', meeting: newMeeting.rows[0] });
    } catch (err) {
        console.error('Create Meeting Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- GET ALL MEETINGS (Upcoming or Past) ---
/**
 * @route   GET /api/meetings
 * @desc    Get a list of all meetings, filtered by upcoming (default) or past.
 * @access  Public or Private
 */
router.get('/', async (req, res) => {
    const { filter } = req.query;
    let query;

    if (filter === 'past') {
        // Get meetings that have already happened, most recent first
        query = "SELECT * FROM meetings WHERE (meeting_date + meeting_time) < NOW() ORDER BY meeting_date DESC, meeting_time DESC";
    } else {
        // Get upcoming meetings, nearest first
        query = "SELECT * FROM meetings WHERE (meeting_date + meeting_time) >= NOW() ORDER BY meeting_date ASC, meeting_time ASC";
    }

    try {
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Get Meetings Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- UPDATE A MEETING ---
/**
 * @route   PATCH /api/meetings/:id
 * @desc    Update an existing meeting.
 * @access  Private (Admin)
 */
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, meeting_date, meeting_time, location, description } = req.body;

    try {
        const fieldsToUpdate = { title, meeting_date, meeting_time, location, description };
        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(fieldsToUpdate)) {
            if (value !== undefined) {
                fields.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields provided for update.' });
        }

        values.push(id);
        const updateQuery = `UPDATE meetings SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        
        const { rows } = await pool.query(updateQuery, values);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Meeting not found.' });
        }
        res.status(200).json({ message: 'Meeting updated successfully', meeting: rows[0] });
    } catch (err) {
        console.error('Update Meeting Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- DELETE A MEETING ---
/**
 * @route   DELETE /api/meetings/:id
 * @desc    Delete a meeting by its ID.
 * @access  Private (Admin)
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM meetings WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Meeting not found.' });
        }
        res.status(200).json({ message: 'Meeting deleted successfully.' });
    } catch (err) {
        console.error('Delete Meeting Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;
