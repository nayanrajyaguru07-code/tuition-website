const express = require("express");
const pool = require("../../connections/DB.connect.js");
const { hashPassword } = require("../../utils/hash.js");
// IMPORTANT: You need an authentication middleware to protect these routes
// const authMiddleware = require('../middleware/authMiddleware.js');

const router = express.Router();

/**
 * @route   PATCH /api/profile
 * @desc    Update the logged-in user's profile (username, email, or password).
 * @access  Private (Requires Token)
 */
// router.patch('/', authMiddleware, async (req, res) => { // Uncomment when you have middleware
router.patch("/", async (req, res) => {
  // For this to work securely, the user ID should come from the decoded token,
  // not from the request body or params.
  // const { id } = req.user; // Assuming middleware adds user info to req.user
  const { id } = { id: 1 }; // <<<<<------ Replace with 'req.user.id' once you have auth middleware

  const { username, email, password } = req.body;

  if (!username && !email && !password) {
    return res
      .status(400)
      .json({
        error:
          "At least one field (username, email, password) is required for update.",
      });
  }

  try {
    const client = await pool.connect();
    await client.query("BEGIN");

    // Check for username/email conflicts if they are being updated
    if (username || email) {
      const conflictCheck = await client.query(
        "SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3",
        [username, email, id]
      );
      if (conflictCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return res
          .status(409)
          .json({
            error:
              "This username or email is already taken by another account.",
          });
      }
    }

    // Build the update query dynamically
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (password) updates.password = await hashPassword(password);

    const fields = Object.keys(updates);
    const setClause = fields
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");
    const values = fields.map((key) => updates[key]);
    values.push(id);

    const { rows } = await client.query(
      `UPDATE users SET ${setClause} WHERE id = $${values.length} RETURNING id, username, email`,
      values
    );

    await client.query("COMMIT");
    res
      .status(200)
      .json({ message: "Profile updated successfully", user: rows[0] });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- DELETE USER'S OWN ACCOUNT ---
/**
 * @route   DELETE /api/profile
 * @desc    Delete the logged-in user's own account.
 * @access  Private (Requires Token)
 */
// router.delete('/', authMiddleware, async (req, res) => { // Uncomment when you have middleware
router.delete("/", async (req, res) => {
  // The user ID should come from the decoded token for security.
  // const { id } = req.user;
  const { id } = { id: 1 }; // <<<<<------ Replace with 'req.user.id'

  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    // You might want to clear the login cookie on the client-side after this
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (err) {
    console.error("Delete Account Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
