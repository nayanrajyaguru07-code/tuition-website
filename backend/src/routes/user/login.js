const express = require("express");
// const crypto = require("crypto"); // For generating tokens
const nodemailer = require("nodemailer"); // For sending emails
const { generateToken } = require("../../utils/jwt.js");
const { comparePassword } = require("../../utils/hash.js");
const pool = require("../../connections/DB.connect.js");

require("dotenv").config();

const router = express.Router();

// --- Your Existing Login Route ---
router.post("/", async (req, res) => {
  // Assuming this file is mounted at /login in your main server file
  const { grNo, password } = req.body;

  if (!grNo || !password) {
    return res.status(400).json({ error: "Gr No and password are required" });
  }

  try {
    const DBres = await pool.query("SELECT * FROM users WHERE gr_no = $1", [
      grNo,
    ]);

    if (DBres.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = DBres.rows[0];

    if (!user.password) {
      return res
        .status(401)
        .json({ error: "This account is not configured for password login." });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const studentRes = await pool.query(
      "SELECT id, class_id, student_name FROM student WHERE gr_no = $1",
      [grNo]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({
        error: "Login successful, but no matching student record found.",
      });
    }

    const studentId = studentRes.rows[0].id;

    const data = {
      id: studentId,
      grNo: user.gr_no,
      student_name: studentRes.student_name

    };
    const token = generateToken(data);

    // ✅ RETURN token AND student_id (NOT cookies)
    return res.status(200).json({
      message: "Login successful",
      token: token,
      student_id: studentId,
      class_id: studentRes.rows[0].class_id,
      student_name: studentRes.rows[0].student_name
    }); // Send user data including role
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
