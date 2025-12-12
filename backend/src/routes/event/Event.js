const express = require("express");
const pool = require("../../connections/DB.connect.js");

const router = express.Router();

// --- CREATE A NEW EVENT ---
/**
 * @route   POST /api/events
 * @desc    Create a new school event (can be class-specific or school-wide).
 * @access  Private (Admin)
 */
router.post("/", async (req, res) => {
  const { title, class_id, event_date, event_time, location, description } =
    req.body;

  if (!title || !event_date || !event_time) {
    return res
      .status(400)
      .json({ error: "title, event_date, and event_time are required." });
  }

  let client;
  try {
    client = await pool.connect();
    const newEvent = await client.query(
      `INSERT INTO events (title, class_id, event_date, event_time, location, description)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
      [title, class_id, event_date, event_time, location, description]
    );
    res
      .status(201)
      .json({ message: "Event created successfully", event: newEvent.rows[0] });
  } catch (err) {
    console.error("Create Event Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// --- GET ALL EVENTS (Upcoming or Past) ---
/**
 * @route   GET /api/events
 * @desc    Get a list of all events, filtered by upcoming (default) or past.
 * @access  Public or Private
 */
// This is your corrected backend code
router.get("/", async (req, res) => {
  const { filter } = req.query;
  let query;

  // --- FIX ---
  // Add ::date and ::time to explicitly cast the columns.
  // This allows PostgreSQL to combine them into a timestamp for comparison.
  if (filter === "past") {
    query = `
      SELECT * FROM events 
      WHERE (event_date::date + event_time::time) < NOW() 
      ORDER BY event_date DESC, event_time DESC
    `;
  } else {
    query = `
      SELECT * FROM events 
      WHERE (event_date::date + event_time::time) >= NOW() 
      ORDER BY event_date ASC, event_time ASC
    `;
  }
  // --- END FIX ---

  let client;
  try {
    client = await pool.connect();
    const { rows } = await client.query(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Events Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// --- UPDATE AN EVENT ---
/**
 * @route   PATCH /api/events/:id
 * @desc    Update an existing event.
 * @access  Private (Admin)
 */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, class_id, event_date, event_time, location, description } =
    req.body;

  const updates = {
    title,
    class_id,
    event_date,
    event_time,
    location,
    description,
  };
  const fields = Object.keys(updates).filter(
    (key) => updates[key] !== undefined
  );

  if (fields.length === 0) {
    return res.status(400).json({ error: "No fields provided for update." });
  }

  const setClause = fields
    .map((key, index) => `${key} = $${index + 1}`)
    .join(", ");
  const values = fields.map((key) => updates[key]);
  values.push(id);

  let client;
  try {
    client = await pool.connect();
    const { rows } = await client.query(
      `UPDATE events SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Event not found." });
    }
    res
      .status(200)
      .json({ message: "Event updated successfully", event: rows[0] });
  } catch (err) {
    console.error("Update Event Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// --- DELETE AN EVENT ---
/**
 * @route   DELETE /api/events/:id
 * @desc    Delete an event by its ID.
 * @access  Private (Admin)
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      "DELETE FROM events WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Event not found." });
    }
    res.status(200).json({ message: "Event deleted successfully." });
  } catch (err) {
    console.error("Delete Event Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;
