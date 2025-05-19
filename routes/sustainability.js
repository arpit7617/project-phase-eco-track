const express = require('express');
const router = express.Router();
const { db } = require('./database'); // adjust if needed

// Serve sustainability page
router.get('/', (req, res) => {
  res.sendFile('sustainability.html', { root: 'views' });
});

// Handle log submission
router.post("/log", (req, res) => {
  const { activity, category, quantity } = req.body;
  const user_id = req.session.userId;

  if (!activity || !category || isNaN(quantity)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  db.run(
    `INSERT INTO sustainability_logs (user_id, activity, category, quantity)
     VALUES (?, ?, ?, ?)`,
    [user_id, activity, category, quantity],
    function (err) {
      if (err) {
        console.error("Insert error:", err.message);
        return res.status(500).json({ error: "Failed to log activity" });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Fetch logs for chart
router.get('/data', (req, res) => {
  db.all('SELECT * FROM sustainability_logs', [], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching logs:', err.message);
      return res.status(500).json({ error: 'Failed to fetch data.' });
    }
    res.json(rows);
  });
});

module.exports = router;
