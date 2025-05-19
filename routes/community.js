const express = require("express");
const router = express.Router();
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(path.join(__dirname, "..", "database.db"));

// Middleware to protect community route 
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

// GET Community Page — fetch tips from DB and render community.ejs
router.get("/", isLoggedIn, (req, res) => {
  const username = req.session.user;

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

    res.render("community", {
      username: username,
      tips: rows
    });
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
