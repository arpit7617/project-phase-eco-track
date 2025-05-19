const express = require("express");
const axios = require("axios");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const router = express.Router();
const db = new sqlite3.Database(path.join(__dirname, "..", "database.db"));

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

// Helper to log actions in logs table
function logAction(userId, action) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO logs (user_id, action) VALUES (?, ?)`;
    db.run(sql, [userId, action], function(err) {
      if (err) return reject(err);
      console.log(`✅ Log added: ${action} for user ID ${userId}`);
      resolve();
    });
  });
}

// Route to serve weather.html page (accessible to all)
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "weather.html"));
});

// API route to return weather data as JSON (log if logged in)
router.get("/api/weather", async (req, res) => {
  const city = req.query.city || "Delhi";
  const apiKey = process.env.OPENWEATHER_API_KEY;

  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    const response = await axios.get(weatherUrl);
    const data = response.data;

    if (req.session && req.session.user) {
      try {
        const userId = await getUserId(req.session.user);
        await logAction(userId, `Fetched Weather data for city: ${city}`);
      } catch (logErr) {
        console.error("Logging error:", logErr.message);
      }
    }
    console.log("checking test");

    res.json({
      name: data.name,
      icon: data.weather[0].icon,
      temp: data.main.temp,
      condition: data.weather[0].description,
      humidity: data.main.humidity,
      wind: data.wind.speed
    });
  } catch (error) {
    console.error("❌ Weather fetch error:", error.message);
    res.json({ error: "Unable to fetch weather. Try again later." });
  }
});

module.exports = router;
