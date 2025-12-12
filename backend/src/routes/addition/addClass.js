const express = require('express');
const pool = require('../../connections/DB.connect.js');

const router = express.Router();

// --- CREATE A NEW CLASS (POST /) ---
/**
 * @route   POST /api/admin/classes
 * @desc    Admin adds a new class
 * @access  Private (Admin Only)
 */
router.post('/', async (req, res) => {
    const { standard, division } = req.body;

    if (!standard || !division) {
        return res.status(400).json({ error: 'Standard and division are required.' });
    }

    try {
        // Check if the class already exists
        const existingClass = await pool.query(
            'SELECT * FROM classes WHERE standard = $1 AND division = $2',
            [standard, division]
        );

        if (existingClass.rows.length > 0) {
            return res.status(409).json({ error: `Class ${standard}-${division} already exists.` });
        }

        // Insert the new class
        const newClass = await pool.query(
            `INSERT INTO classes (standard, division) VALUES ($1, $2) RETURNING *`,
            [standard, division]
        );

        res.status(201).json({
            message: 'Class added successfully.',
            class: newClass.rows[0],
        });

    } catch (err) {
        console.error('Add Class Error:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: `Class ${standard}-${division} already exists.` });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- GET ALL CLASSES (GET /) ---
/**
 * @route   GET /api/admin/classes
 * @desc    Get all classes for dropdowns or lists
 * @access  Private (Admin Only)
 */
router.get('/', async (req, res) => {
    try {
        const classes = await pool.query('SELECT id, standard, division FROM classes ORDER BY standard, division');
        res.status(200).json(classes.rows);
    } catch (err) {
        console.error('Get Classes Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- UPDATE A CLASS (PATCH /:id) ---
/**
 * @route   PATCH /api/admin/classes/:id
 * @desc    Update a class details (standard or division)
 * @access  Private (Admin Only)
 */
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { standard, division } = req.body;

    // Allow partial updates
    const updates = { standard, division };
    const fields = Object.keys(updates).filter(key => updates[key] !== undefined);

    if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields provided for update.' });
    }

    const setClause = fields.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = fields.map(key => updates[key]);
    values.push(id); // Add ID for WHERE clause

    try {
        const { rows } = await pool.query(
            `UPDATE classes SET ${setClause} WHERE id = $${values.length} RETURNING *`,
            values
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Class not found.' });
        }

        res.status(200).json({ message: 'Class updated successfully', class: rows[0] });

    } catch (err) {
        console.error('Update Class Error:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Update failed. This class combination already exists.' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- DELETE A CLASS (DELETE /:id) ---
/**
 * @route   DELETE /api/admin/classes/:id
 * @desc    Delete a class
 * @access  Private (Admin Only)
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM classes WHERE id = $1 RETURNING *', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Class not found.' });
        }

        res.status(200).json({ message: 'Class deleted successfully.' });

    } catch (err) {
        console.error('Delete Class Error:', err);
        // Handle foreign key constraint errors (if students are assigned to this class)
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Cannot delete this class. It has students or other records assigned to it.' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;