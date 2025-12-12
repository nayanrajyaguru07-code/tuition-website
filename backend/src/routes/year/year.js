const express = require("express");
const pool = require("../../connections/DB.connect.js");
const { hashPassword } = require("../../utils/hash.js"); // --- 1. Brought this back ---

const router = express.Router();

router.delete("/:classId", async (req, res) => {
    const { classId } = req.params;
    let client;

    try {
        client = await pool.connect();

        // Simple DELETE query based on class_id
        const result = await client.query(
            "DELETE FROM student WHERE class_id = $1 RETURNING *",
            [classId]
        );

        // Provide feedback on how many rows were deleted
        res.status(200).json({
            message: "Deletion successful",
            deleted_count: result.rowCount
        });

    } catch (err) {
        console.error("Delete Class Students Error:", err);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        if (client) client.release();
    }
});

router.post("/", async (req, res) => {
    const { fromClassId, toClassId } = req.body;
    let client;

    if (!fromClassId || !toClassId) {
        return res.status(400).json({ error: "Please provide fromClassId and toClassId" });
    }

    try {
        client = await pool.connect();

        // STEP 1: Check if 'toClassId' is empty
        // We limit 1 because we only need to know if ANY student exists
        const checkQuery = `SELECT 1 FROM student WHERE class_id = $1 LIMIT 1`;
        const checkResult = await client.query(checkQuery, [toClassId]);

        // If rows.length > 0, it means the destination class already has students
        if (checkResult.rows.length > 0) {
            return res.status(400).json({
                error: "Destination class is not empty. Cannot move students."
            });
        }

        // STEP 2: Update the class_id for all students
        const updateQuery = `
      UPDATE student 
      SET class_id = $1, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE class_id = $2
    `;

        const updateResult = await client.query(updateQuery, [toClassId, fromClassId]);

        if (updateResult.rowCount === 0) {
            return res.status(404).json({ message: "No students found in the source class to move." });
        }

        res.status(200).json({
            message: "Students moved successfully",
            moved_count: updateResult.rowCount
        });

    } catch (err) {
        console.error("Promote Class Error:", err);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        if (client) client.release();
    }
});
module.exports = router;
