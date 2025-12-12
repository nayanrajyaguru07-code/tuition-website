const express = require('express');
const pool = require('../../connections/DB.connect.js');
const { hashPassword } = require('../../utils/hash.js');

const router = express.Router();

router.post('/', async (req, res) => {
    const { email, password: rawPassword } = req.body;

    if (!email || !rawPassword) {
        return res.status(400).json({ error: 'Email and a new password are required.' });
    }

    // if (rawPassword.length < 6) {
    //     return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    // }

    try {
        // --- Find the faculty member by email ---
        const facultyRes = await pool.query(
            "SELECT * FROM faculty WHERE email = $1",
            [email]
        );

        if (facultyRes.rows.length === 0) {
            return res.status(404).json({ error: 'No faculty member found with this email.' });
        }

        const facultyMember = facultyRes.rows[0];

        // --- Check if a password has already been set ---
        if (facultyMember.password) {
            return res.status(403).json({ error: 'A password has already been set for this account. Please use the "forgot password" option if you need to reset it.' });
        }

        // --- Hash the new password ---
        const hashedPassword = await hashPassword(rawPassword);

        // --- Update the faculty record with the new password ---
        await pool.query(
            `UPDATE faculty SET password = $1 WHERE id = $2`,
            [hashedPassword, facultyMember.id]
        );

        res.status(200).json({ message: 'Password has been set successfully. You can now log in.' });

    } catch (err) {
        console.error('Set Initial Password Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

