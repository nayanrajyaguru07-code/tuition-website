const express = require("express");
const pool = require("../../connections/DB.connect.js");
const { hashPassword } = require("../../utils/hash.js"); // --- 1. Brought this back ---

const router = express.Router();

// routes
router.post("/", async (req, res) => {
  // 2. Destructure all fields
  console.log(req.body);
  const { grNo, email, password } = req.body;

  // 3. Updated validation
  if (!grNo || !email || !password) {
    return res.status(400).json({
      error:
        "All fields are required: grNo, firstName, lastName, email, and password",
    });
  }

  try {
    // 4. Hash the password
    const hashedPassword = await hashPassword(password);

    // 5. Check if Gr no OR email already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE gr_no = $1 OR email = $2",
      [grNo, email]
    );

    if (existingUser.rows.length > 0) {
      // 6. Check which field is conflicting
      const conflictField =
        existingUser.rows[0].gr_no === grNo ? "Gr no" : "email";
      return res
        .status(409)
        .json({ error: `User with this ${conflictField} already exists` });
    }

    // 7. Insert new user with all fields
    const result = await pool.query(
      `INSERT INTO users (gr_no, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, gr_no , email, created_at`,
      [grNo, email, hashedPassword] // --- 8. Added email and hashed password ---
    );

    const user = result.rows[0];
    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
