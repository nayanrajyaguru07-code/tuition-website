const express = require('express');
const pool = require('../../connections/DB.connect.js');

const router = express.Router();

// --- CREATE A NEW FEE TYPE FOR A CLASS ---
/**
 * @route   POST /api/fees
 * @desc    Define a new fee structure for a specific class.
 * @access  Private (Admin)
 * @body    { "fee_name": "Annual Tuition Fee", "class_id": 1, "amount": 50000.00 }
 */
router.post('/', async (req, res) => {
    const { fee_name, class_id, amount } = req.body;

    if (!fee_name || !class_id || amount === undefined) {
        return res.status(400).json({ error: 'fee_name, class_id, and amount are required.' });
    }
    if (isNaN(parseFloat(amount)) || amount < 0) {
        return res.status(400).json({ error: 'Amount must be a non-negative number.' });
    }

    try {
        const newFeeType = await pool.query(
            `INSERT INTO fee_types (fee_name, class_id, amount)
             VALUES ($1, $2, $3) RETURNING *`,
            [fee_name, class_id, amount]
        );
        res.status(201).json({ message: 'Fee structure created successfully', fee_type: newFeeType.rows[0] });
    } catch (err) {
        console.error('Create Fee Type Error:', err);
        if (err.code === '23505') { // Handles the UNIQUE (class_id, fee_name) constraint
            return res.status(409).json({ error: 'This fee type already exists for this class.' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- GET ALL FEE STRUCTURES (Can be filtered by class) ---
/**
 * @route   GET /api/fees
 * @desc    Get all defined fee structures.
 * @access  Private (Admin)
 * @query   ?class_id=1 to filter by a specific class
 */
router.get('/', async (req, res) => {
    const { class_id } = req.query;
    let query = `
        SELECT ft.id, ft.fee_name, ft.amount, c.standard, c.division
        FROM fee_types ft
        JOIN classes c ON ft.class_id = c.id
    `;
    const values = [];

    if (class_id) {
        query += ' WHERE ft.class_id = $1';
        values.push(class_id);
    }
    query += ' ORDER BY c.standard, c.division, ft.fee_name';

    try {
        const { rows } = await pool.query(query, values);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Get Fee Types Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- UPDATE A FEE STRUCTURE ---
/**
 * @route   PATCH /api/fees/:id
 * @desc    Update a fee's details, such as its name or amount.
 * @access  Private (Admin)
 */
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { fee_name, class_id, amount } = req.body;

    const updates = { fee_name, class_id, amount };
    const fields = Object.keys(updates).filter(key => updates[key] !== undefined);

    if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields provided for update.' });
    }

    const setClause = fields.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = fields.map(key => updates[key]);
    values.push(id);

    try {
        const { rows } = await pool.query(
            `UPDATE fee_types SET ${setClause} WHERE id = $${values.length} RETURNING *`,
            values
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Fee type not found.' });
        }
        res.status(200).json({ message: 'Fee structure updated successfully', fee_type: rows[0] });
    } catch (err) {
        console.error('Update Fee Type Error:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Update failed. This fee type already exists for the specified class.' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- DELETE A FEE STRUCTURE ---
/**
 * @route   DELETE /api/fees/:id
 * @desc    Delete a fee type. This will cascade and delete related payment records.
 * @access  Private (Admin)
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM fee_types WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Fee type not found.' });
        }
        res.status(200).json({ message: 'Fee structure deleted successfully.' });
    } catch (err) {
        console.error('Delete Fee Type Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

