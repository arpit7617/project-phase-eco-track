const express = require('express');
const router = express.Router();
const { db } = require('./database'); // adjust if needed

// Serve sustainability page
router.get('/', (req, res) => {
  const username = req.session.user;

  if (!username) {
    return res.redirect('/login');
  }
  res.sendFile('sustainability.html', { root: 'views' });
});

// Handle log submission
router.post("/log", (req, res) => {
  const { activity, category, quantity } = req.body;
  const username = req.session.user;

  if (!username) {
    return res.redirect('/login');
  }

  if (!activity || !category || isNaN(quantity)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  // Step 1: Get user_id from username
  db.get(
    `SELECT id FROM users WHERE username = ?`,
    [username],
    (err, row) => {
      if (err) {
        console.error("DB error finding user:", err.message);
        return res.status(500).json({ error: "Database error while finding user." });
      }

      if (!row) {
        return res.status(404).json({ error: "User not found." });
      }

      const user_id = row.id;

      // Step 2: Insert into sustainability_logs
      db.run(
        `INSERT INTO sustainability_logs (user_id, activity, category, quantity)
         VALUES (?, ?, ?, ?)`,
        [user_id, activity, category, quantity],
        function (err) {
          if (err) {
            console.error("Insert error:", err.message);
            return res.status(500).json({ error: "Failed to log activity." });
          }
          res.json({ success: true, id: this.lastID });
        }
      );
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
