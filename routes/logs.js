const express = require("express");
const router = express.Router();
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(path.join(__dirname, "..", "database.db"));

// Middleware to ensure user is logged in
function ensureLoggedIn(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect("/login");
}

// Serve logs HTML page
router.get("/logs", ensureLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "logs.html"));
});

// Serve logs as JSON with pagination and IST conversion
router.get("/api/logs", ensureLoggedIn, (req, res) => {
  const username = req.session.user;
  const page = parseInt(req.query.page) || 1; // current page from query, default 1
  const limit = 10;
  const offset = (page - 1) * limit;

  // First, get user_id from username
  const userQuery = `SELECT id FROM users WHERE username = ?`;
  db.get(userQuery, [username], (err, userRow) => {
    if (err) {
      console.error("Error fetching user ID:", err);
      return res.status(500).json({ error: "Failed to fetch user" });
    }

    if (!userRow) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userRow.id;

    // Get total count of logs for pagination
    const countQuery = `SELECT COUNT(*) as count FROM logs WHERE user_id = ?`;
    db.get(countQuery, [userId], (err, countRow) => {
      if (err) {
        console.error("Error counting logs:", err);
        return res.status(500).json({ error: "Failed to count logs" });
      }

      const totalLogs = countRow.count;
      const totalPages = Math.ceil(totalLogs / limit);

      // Fetch logs for current page with limit and offset
      const logsQuery = `
        SELECT action, timestamp
        FROM logs
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `;
      db.all(logsQuery, [userId, limit, offset], (err, logs) => {
        if (err) {
          console.error("Error fetching logs:", err);
          return res.status(500).json({ error: "Failed to fetch logs" });
        }

        // Convert timestamp to IST + format it
        const istLogs = logs.map(log => {
          const utcDate = new Date(log.timestamp);
          const istOffset = 5.5 * 60; // IST = UTC + 5:30
          const istDate = new Date(utcDate.getTime() + istOffset * 60 * 1000);
          return {
            ...log,
            timestamp: istDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          };
        });

        res.json({
          logs: istLogs,
          pagination: {
            page,
            totalPages,
            totalLogs,
          },
        });
      });
    });
  });
});

module.exports = router;
