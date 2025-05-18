const express = require("express");
const router = express.Router();
const path = require("path");

// In-memory user store (for testing only)
const users = [];

// GET Signup Page
router.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "signup.html"));
});

// POST Signup
router.post("/signup", (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.send("⚠️ User already exists. Please <a href='/login'>Login</a>.");
  }
  users.push({ username, password });
  req.session.user = username;
  res.redirect("/community");
});

// GET Login Page
router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "login.html"));
});

// POST Login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.send("❌ Invalid credentials. <a href='/login'>Try again</a>.");
  }
  req.session.user = username;
  res.redirect("/community");
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.send("👋 Logged out. <a href='/login'>Login again</a>.");
});

module.exports = router;
