// src/routes/meeting/meeting.js
const express = require("express");
const router = express.Router();
const db = require("../../connections/DB.connect.js"); // create this file if you don't have it

// create or return existing meeting by slug
router.post("/create", async (req, res) => {
  try {
    const { slug, title, owner_id } = req.body;
    if (!slug) return res.status(400).json({ error: "slug required" });

    const insert = await db.query(
      `INSERT INTO meetings (slug, title, owner_id) VALUES ($1,$2,$3) ON CONFLICT (slug) DO NOTHING RETURNING *`,
      [slug, title || null, owner_id || null]
    );

    if (insert.rows.length) return res.status(201).json(insert.rows[0]);

    const existing = await db.query(`SELECT * FROM meetings WHERE slug=$1`, [
      slug,
    ]);
    return res.status(200).json(existing.rows[0]);
  } catch (err) {
    console.error("create meeting err", err);
    return res.status(500).json({ error: "internal" });
  }
});

// get meeting by slug
router.get("/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const q = await db.query(`SELECT * FROM meetings WHERE slug = $1`, [slug]);
    if (!q.rows.length) return res.status(404).json({ error: "not found" });
    return res.json(q.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal" });
  }
});

module.exports = router;
