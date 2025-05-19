const express = require("express");
const router = express.Router();
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(path.join(__dirname, "..", "database.db"));

// ✅ Middleware to protect community route
function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

// Helper to get user id from username
function getUserId(username) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT id FROM users WHERE username = ?`;
    db.get(sql, [username], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error("User not found"));
      resolve(row.id);
    });
  });
}

function logAction(userId, action) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO logs (user_id, action) VALUES (?, ?)`;
    db.run(sql, [userId, action], function(err) {
      if (err) return reject(err);
      resolve();
    });
  });
}


// GET Community Page — fetch tips from DB
router.get("/", isLoggedIn, (req, res) => {
  const username = req.session.user;

  // Fetch all tips joined with usernames
  const sql = `
    SELECT community_tips.tip, users.username 
    FROM community_tips 
    JOIN users ON community_tips.user_id = users.id 
    ORDER BY community_tips.created_at DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.send("⚠️ Error loading community tips.");
    }

    let tipsHTML = rows.map(tip => `
      <p><strong>${tip.username}:</strong> ${tip.tip}</p>
    `).join("");

    if (!tipsHTML) {
      tipsHTML = "<p>No tips shared yet. Be the first!</p>";
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>EcoTrack - Community</title>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <nav>
          <a href="/">Home</a>
          <a href="/weather">Weather</a>
          <a href="/aqi">AQI Monitor</a>
          <a href="/community">Community</a>
          <a href="/logout">Logout (${username})</a>
        </nav>

        <h1>🌍 EcoTrack Community</h1>
        <p>Share your eco-friendly tips and learn from others!</p>

        <form action="/community" method="POST">
          <label for="username">Your Name:</label>
          <input type="text" id="username" name="username" value="${username}" readonly>

          <label for="tip">Your Eco-Friendly Tip:</label>
          <textarea id="tip" name="tip" rows="4" required></textarea>

          <button type="submit">Share Tip</button>
        </form>

        <h2>📚 Community Tips</h2>
        <div id="tips-container">${tipsHTML}</div>
      </body>
      </html>
    `);
  });
});

// POST Tip — insert into DB using logged in user's ID
router.post("/", isLoggedIn, async (req, res) => {
  const { tip } = req.body;
  const username = req.session.user;

  if (!tip || !username) {
    return res.redirect("/community");
  }

  try {
    const userId = await getUserId(username);

    const insertTipSql = `INSERT INTO community_tips (user_id, tip) VALUES (?, ?)`;
    db.run(insertTipSql, [userId, tip], async function(err) {
      if (err) {
        console.error("Failed to save tip:", err);
        return res.send("⚠️ Failed to save your tip. Please try again.");
      }

      // Log the action of posting a tip
      try {
        await logAction(userId, `Posted a community tip: "${tip.substring(0, 50)}"`);
      } catch (logErr) {
        console.error("Failed to log action:", logErr);
      }

      res.redirect("/community");
    });
  } catch (error) {
    console.error(error);
    res.send("⚠️ User not found. Please log in again.");
  }
});

module.exports = router;
