// routes/aqi.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/", async (req, res) => {
  const city = req.query.city || "Delhi";
  const airKey = process.env.IQAIR_API_KEY;
  const weatherKey = process.env.OPENWEATHER_API_KEY;

  try {
    // Get city coordinates
    const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${weatherKey}`;
    const geoResponse = await axios.get(geoUrl);

    if (!geoResponse.data.length) throw new Error("City not found.");
    const { lat, lon, name, country } = geoResponse.data[0];

    // Get AQI data
    const aqiUrl = `http://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${airKey}`;
    const aqiResponse = await axios.get(aqiUrl);

    const data = aqiResponse.data.data;
    const pollution = data.current.pollution;

    const aqi = pollution.aqius;
    let aqiStatus = "";
    let advice = "";

    if (aqi <= 50) {
      aqiStatus = "Good";
      advice = "Air quality is ideal for most individuals.";
    } else if (aqi <= 100) {
      aqiStatus = "Moderate";
      advice = "Unusually sensitive people should consider limiting outdoor activity.";
    } else if (aqi <= 150) {
      aqiStatus = "Unhealthy for Sensitive Groups";
      advice = "People with respiratory or heart issues should limit prolonged exertion.";
    } else if (aqi <= 200) {
      aqiStatus = "Unhealthy";
      advice = "Everyone may begin to experience health effects.";
    } else if (aqi <= 300) {
      aqiStatus = "Very Unhealthy";
      advice = "Health warnings of emergency conditions.";
    } else {
      aqiStatus = "Hazardous";
      advice = "Everyone should avoid all outdoor exertion.";
    }

    // Send custom HTML
    const html = `
      <html>
        <head>
          <title>EcoTrack - AQI</title>
          <link rel="stylesheet" href="/style.css">
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
        </head>
        <body>
          <nav>
            <a href="/">Home</a>
            <a href="/weather">Weather</a>
            <a href="/aqi">AQI Monitor</a>
            <a href="/community">Community</a>
            <a href="/location">📍 Live Location</a>
          </nav>

          <h1>Air Quality Index 🌫️</h1>

          <form method="GET" action="/aqi" class="weather-form">
            <label for="city">Enter City:</label>
            <input type="text" id="city" name="city" required placeholder="e.g., Delhi">
            <button type="submit">Get AQI</button>
          </form>

          <div id="aqi-info">
            <h2>${name}, ${country}</h2>
            <p><strong>AQI:</strong> ${aqi} (${aqiStatus})</p>
            <p><strong>Main Pollutant:</strong> ${pollution.mainus}</p>
            <p><strong>Health Advice:</strong> ${advice}</p>
            <p><strong>Last Updated:</strong> ${pollution.ts}</p>
          </div>

          <footer>
            © 2025 EcoTrack · Stay Safe, Breathe Clean 💚
          </footer>
        </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    console.error("AQI Error:", err.message);
    res.send(`
      <html>
        <head><title>EcoTrack - AQI</title><link rel="stylesheet" href="/style.css"></head>
        <body>
          <nav>
            <a href="/">Home</a>
            <a href="/weather">Weather</a>
            <a href="/aqi">AQI Monitor</a>
            <a href="/community">Community</a>
            <a href="/location">📍 Live Location</a>
          </nav>
          <h1>Unable to fetch AQI for "${req.query.city || 'Unknown'}"</h1>
          <p>Please try another city.</p>
        </body>
      </html>
    `);
  }
});

module.exports = router;
