const express = require('express');
const router = express.Router();
const { db } = require('../db/database'); // Adjust path if needed

// Route to log sustainability activity
router.post('/log', (req, res) => {
  const { user_id, category, quantity, unit } = req.body;

  if (!user_id || !category) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const query = `
    INSERT INTO sustainability_logs (user_id, category, quantity, unit)
    VALUES (?, ?, ?, ?)
  `;
  db.run(query, [user_id, category, quantity, unit], function (err) {
    if (err) {
      console.error("Insert error:", err.message);
      return res.status(500).json({ error: "Failed to log activity" });
    }
    res.json({ success: true, id: this.lastID });
  });
});

// Route to get summary (weekly or monthly)
router.get('/summary', (req, res) => {
  const { user_id, period = 'week' } = req.query;

  const query = `
    SELECT category, strftime('%Y-%W', timestamp) AS period, SUM(quantity) AS total
    FROM sustainability_logs
    WHERE user_id = ?
    GROUP BY category, period
    ORDER BY period DESC
    LIMIT 10
  `;

  db.all(query, [user_id], (err, rows) => {
    if (err) {
      console.error("Query error:", err.message);
      return res.status(500).json({ error: "Failed to fetch summary" });
    }
    res.json(rows);
  });
});

module.exports = router;
