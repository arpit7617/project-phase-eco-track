const express = require("express");
const router = express.Router();
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");  

const db = new sqlite3.Database(path.join(__dirname, "..", "database.db"));

const SALT_ROUNDS = 10; // bcrypt salt complexity

// GET Signup Page
router.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "signup.html"));
});

// POST Signup
router.post("/signup", (req, res) => {
  const { fullname, username, email, phone, password, confirm_password } = req.body;

  if (password !== confirm_password) {
    return res.send("⚠️ Passwords do not match. Please <a href='/signup'>try again</a>.");
  }

  const checkUserSql = `SELECT * FROM users WHERE username = ? OR email = ?`;
  db.get(checkUserSql, [username, email], (err, row) => {
    if (err) {
      return res.send("⚠️ Database error. Please try again later.");
    }
    if (row) {
      return res.send("⚠️ User with this username or email already exists. Please <a href='/login'>Login</a>.");
    }

    // Hash the password before saving
    bcrypt.hash(password, SALT_ROUNDS, (hashErr, hashedPassword) => {
      if (hashErr) {
        return res.send("⚠️ Error processing password. Please try again.");
      }

      const insertUserSql = `INSERT INTO users (fullname, username, email, phone, password) VALUES (?, ?, ?, ?, ?)`;
      db.run(insertUserSql, [fullname, username, email, phone, hashedPassword], function(err) {
        if (err) {
          return res.send("⚠️ Failed to create user. Please try again.");
        }
        req.session.user = username;
        res.redirect("/community");
      });
    });
  });
});

// GET Login Page
router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "login.html"));
});

// POST Login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const sql = `SELECT * FROM users WHERE username = ?`;

  db.get(sql, [username], (err, user) => {
    if (err) {
      return res.send("⚠️ Database error. Please try again later.");
    }
    if (!user) {
      return res.send("❌ Invalid credentials. <a href='/login'>Try again</a>.");
    }

    // Compare hashed password
    bcrypt.compare(password, user.password, (compareErr, isMatch) => {
      if (compareErr) {
        return res.send("⚠️ Error verifying password. Please try again.");
      }
      if (!isMatch) {
        return res.send("❌ Invalid credentials. <a href='/login'>Try again</a>.");
      }
      req.session.user = username;
      res.redirect("/community");
    });
  });
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;
