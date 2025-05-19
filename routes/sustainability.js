const express = require('express');
const router = express.Router();


// POST to log a sustainability action
router.post('/log', (req, res) => {
  const { user_id, category, quantity } = req.body;

  if (!user_id || !category) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  db.run(
    `INSERT INTO sustainability_logs (user_id, category, quantity) VALUES (?, ?, ?)`,
    [user_id, category, quantity || 1],
    function (err) {
      if (err) {
        console.error('❌ Insert error:', err.message);
        return res.status(500).json({ error: 'Failed to log action.' });
      }
      res.json({ message: 'Action logged!', id: this.lastID });
    }
  );
});

// GET progress summary (weekly/monthly)
router.get('/summary/:userId', (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT category, SUM(quantity) AS total, strftime('%Y-%m', date_logged) AS month
    FROM sustainability_logs
    WHERE user_id = ?
    GROUP BY category, month
    ORDER BY month DESC
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error('❌ Query error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch summary.' });
    }
    res.json(rows);
  });
});

module.exports = router;
