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
    db.run(sql, [userId, action], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Serve the static AQI HTML page (accessible to all)
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "aqi.html"));
});

// Provide AQI data as JSON (accessible to all)
router.get("/api/aqi", async (req, res) => {
  const city = req.query.city || "Delhi";
  const airKey = process.env.IQAIR_API_KEY;
  const weatherKey = process.env.OPENWEATHER_API_KEY;

  try {
    // Get coordinates of the city
    const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${weatherKey}`;
    const geoResponse = await axios.get(geoUrl);

    if (!geoResponse.data.length) throw new Error("City not found.");
    const { lat, lon, name, country } = geoResponse.data[0];

    // Get AQI data
    const aqiUrl = `http://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${airKey}`;
    const aqiResponse = await axios.get(aqiUrl);

    const pollution = aqiResponse.data.data.current.pollution;

    const aqi = pollution.aqius;
    let aqiStatus = "";
    let advice = "";
    let aqiClass = "";

    if (aqi <= 50) {
      aqiStatus = "Good";
      advice = "Air quality is ideal for most individuals.";
      aqiClass = "good";
    } else if (aqi <= 100) {
      aqiStatus = "Moderate";
      advice = "Unusually sensitive people should consider limiting outdoor activity.";
      aqiClass = "moderate";
    } else if (aqi <= 150) {
      aqiStatus = "Unhealthy for Sensitive Groups";
      advice = "People with respiratory or heart issues should limit prolonged exertion.";
      aqiClass = "sensitive";
    } else if (aqi <= 200) {
      aqiStatus = "Unhealthy";
      advice = "Everyone may begin to experience health effects.";
      aqiClass = "unhealthy";
    } else if (aqi <= 300) {
      aqiStatus = "Very Unhealthy";
      advice = "Health warnings of emergency conditions.";
      aqiClass = "very-unhealthy";
    } else {
      aqiStatus = "Hazardous";
      advice = "Everyone should avoid all outdoor exertion.";
      aqiClass = "hazardous";
    }

    // If user is logged in, log the action
    if (req.session && req.session.user) {
      try {
        const userId = await getUserId(req.session.user);
        await logAction(userId, `Fetched AQI data for city: ${city}`);
      } catch (logErr) {
        console.error("Logging error:", logErr.message);
      }
    }

    // Send JSON response
    res.json({
      name,
      country,
      aqi,
      aqiStatus,
      aqiClass,
      mainPollutant: pollution.mainus,
      advice,
      updated: pollution.ts,
    });
  } catch (err) {
    console.error("AQI Error:", err.message);
    res.json({ error: "Unable to fetch AQI data. Try another city." });
  }
});

module.exports = router;
