const express = require("express");
const pool = require("../../connections/DB.connect.js");
const { generateToken } = require("../../utils/jwt.js");
const { comparePassword } = require("../../utils/hash.js");

const router = express.Router();

router.post("/", async (req, res) => {
    const { email, password } = req.body;

    // --- 1. Validation ---
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        // --- 2. Find Faculty by Email ---
        const DBres = await pool.query("SELECT * FROM faculty WHERE email = $1", [email]);

        if (DBres.rows.length === 0) {
            // Use a generic error for security (prevents user enumeration)
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const faculty = DBres.rows[0];

        // --- 3. Check if Initial Password is Set ---
        // A faculty member cannot log in if they haven't created a password yet.
        if (!faculty.password) {
            return res.status(403).json({ error: "Account not activated. Please set your initial password." });
        }

        // --- 4. Compare Passwords ---
        const isMatch = await comparePassword(password, faculty.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // --- 5. Generate JWT ---
        // The payload identifies the user and their role.
        const payload = {
            id: faculty.id,
            name: faculty.name,
            role: 'faculty' // Explicitly set role for middleware checks
        };
        const token = generateToken(payload);

        // --- 6. Set Cookie and Send Response ---
        res
            .status(200)
            .cookie("faculty_login_token", token, {
                httpOnly: true, // Prevents client-side JS from accessing the cookie
                secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
                sameSite: "strict", // Helps prevent CSRF attacks
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            })
            .json({
                message: "Login successful",
                token,
                user: payload
            });
            
    } catch (err) {
        console.error("Faculty Login Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
