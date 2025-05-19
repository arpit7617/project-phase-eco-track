// routes/weather.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/", async (req, res) => {
  const city = req.query.city || "Delhi";
  const apiKey = process.env.OPENWEATHER_API_KEY;

  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    const response = await axios.get(weatherUrl);
    const data = response.data;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Weather - ${data.name}</title>
        <link rel="stylesheet" href="/style.css" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins&display=swap" rel="stylesheet">
      </head>
      <body>

        <nav>
          <a href="/">Home</a>
          <a href="/weather">Weather</a>
          <a href="/aqi">AQI Monitor</a>
          <a href="/community">Community</a>
          <a href="/location">📍 Live Location</a>
        </nav>

        <h1>Real-Time Weather 🌦️</h1>

        <form action="/weather" method="GET" class="weather-form">
          <label for="city">Enter City:</label>
          <input type="text" id="city" name="city" required>
          <button type="submit">Get Weather</button>
        </form>

        <div id="weather-info">
          <h2>Weather in ${data.name}</h2>
          <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather icon" />
          <p><strong>Temperature:</strong> ${data.main.temp}°C</p>
          <p><strong>Condition:</strong> ${data.weather[0].description}</p>
          <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
          <p><strong>Wind Speed:</strong> ${data.wind.speed} m/s</p>
        </div>

        <footer>
          © 2025 EcoTrack · Stay Weather-Aware ☀️🌧️
        </footer>
        
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error("Weather fetch error:", error.message);
    res.send(`
      <h1>❌ Could not fetch weather for "${city}".</h1>
      <a href="/weather">← Try another city</a>
    `);
  }
});

module.exports = router;
