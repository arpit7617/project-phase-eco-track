const express = require("express");
const router = express.Router();

// In-memory storage for tips
const tips = [];

// ✅ Middleware to protect community route
function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

// ✅ GET Community Page — only accessible when logged in
router.get("/", isLoggedIn, (req, res) => {
  let tipsHTML = tips.map((tip) => `
    <p><strong>${tip.username}:</strong> ${tip.tip}</p>
  `).join("");

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
        <a href="/logout">Logout (${req.session.user})</a>
      </nav>

      <h1>🌍 EcoTrack Community</h1>
      <p>Share your eco-friendly tips and learn from others!</p>

      <form action="/community" method="POST">
        <label for="username">Your Name:</label>
        <input type="text" id="username" name="username" value="${req.session.user}" readonly>

        <label for="tip">Your Eco-Friendly Tip:</label>
        <textarea id="tip" name="tip" rows="4" required></textarea>

        <button type="submit">Share Tip</button>
      </form>

      <h2>📚 Community Tips</h2>
      <div id="tips-container">${tipsHTML || "<p>No tips shared yet. Be the first!</p>"}</div>
    </body>
    </html>
  `);
});

// ✅ POST Tip — still protected (uses logged in user)
router.post("/", isLoggedIn, (req, res) => {
  const { tip } = req.body;
  const username = req.session.user;

  if (username && tip) {
    tips.push({ username, tip });
  }
  res.redirect("/community");
});

module.exports = router;
