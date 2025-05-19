const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(path.join(__dirname, "..", "database.db"));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "..", "public", "uploads", "community");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Middleware to protect route, redirect if not logged in
function isLoggedIn(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect("/login");
}

// Helper to get user ID from username
function getUserId(username) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id FROM users WHERE username = ?`, [username], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error("User not found"));
      resolve(row.id);
    });
  });
}

// Log user action helper
function logAction(userId, action) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO logs (user_id, action) VALUES (?, ?)`, [userId, action], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

// GET /community - Render community page with tips
router.get("/", isLoggedIn, (req, res) => {
  const username = req.session.user;

  const tipsSql = `
    SELECT community_tips.id, community_tips.tip, community_tips.image AS image_path, community_tips.likes, 
           datetime(community_tips.created_at, 'localtime') as date, users.username
    FROM community_tips 
    JOIN users ON community_tips.user_id = users.id 
    ORDER BY community_tips.created_at DESC
  `;

  const topContributorsSql = `
    SELECT users.username, COUNT(community_tips.id) AS tipCount
    FROM users
    LEFT JOIN community_tips ON users.id = community_tips.user_id
    GROUP BY users.id
    ORDER BY tipCount DESC
    LIMIT 5
  `;

  db.all(tipsSql, [], (err, tipsRows) => {
    if (err) {
      console.error("Error fetching community tips:", err);
      return res.send("Error loading community tips.");
    }

    db.all(topContributorsSql, [], (err, contributorsRows) => {
      if (err) {
        console.error("Error fetching top contributors:", err);
        return res.send("Error loading top contributors.");
      }

      const tips = (tipsRows || []).map(row => ({
        id: row.id,
        tip: row.tip,
        username: row.username,
        imageUrl: row.image_path ? `/uploads/community/${row.image_path}` : null,
        likes: row.likes || 0,
        date: row.date,
      }));

      const topContributors = (contributorsRows || []).map(row => ({
        username: row.username,
        tipCount: row.tipCount,
      }));

      res.render("community", { username, tips, topContributors });
    });
  });
});



// POST /community - Handle new tip submission with optional image upload
router.post("/", isLoggedIn, upload.single("image"), async (req, res) => {
  const { tip } = req.body;
  const username = req.session.user;
  const imageFile = req.file;

  if (!tip || !username) return res.redirect("/community");

  try {
    const userId = await getUserId(username);
    const imagePath = imageFile ? imageFile.filename : null;

    const insertSql = `INSERT INTO community_tips (user_id, tip, image) VALUES (?, ?, ?)`;
    db.run(insertSql, [userId, tip, imagePath], async function (err) {
      if (err) {
        console.error("Failed to save tip:", err);
        return res.send("Failed to save your tip.");
      }

      try {
        await logAction(userId, `Posted a community tip: "${tip.substring(0, 50)}"`);
      } catch (logErr) {
        console.error("Log error:", logErr);
      }

      res.redirect("/community");
    });
  } catch (err) {
    console.error(err);
    res.send("User error. Please log in again.");
  }
});

// POST /community/like - Like a tip (one like per user)
router.post("/like", isLoggedIn, async (req, res) => {
  const username = req.session.user;
  const { tipId } = req.body;

  if (!tipId) return res.status(400).json({ error: "Tip ID missing" });

  try {
    const userId = await getUserId(username);

    // Try to insert a like (if unique constraint violated, means already liked)
    const insertLike = () => new Promise((resolve, reject) => {
      db.run(`INSERT INTO likes (user_id, tip_id) VALUES (?, ?)`, [userId, tipId], function (err) {
        if (err) return reject(err);
        resolve();
      });
    });

    await insertLike();

    // Update likes count in community_tips table
    const updateLikes = () => new Promise((resolve, reject) => {
      db.run(`UPDATE community_tips SET likes = likes + 1 WHERE id = ?`, [tipId], function (err) {
        if (err) return reject(err);
        resolve();
      });
    });

    await updateLikes();

    res.json({ success: true });

  } catch (err) {
    // If error is unique constraint violation, user already liked
    if (err.message && err.message.includes("UNIQUE")) {
      return res.json({ success: false, message: "Already liked" });
    }

    console.error("Like error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
