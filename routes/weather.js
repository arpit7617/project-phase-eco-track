// routes/weather.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/", async (req, res) => {
  const city = req.query.city || "Delhi";
  const apiKey = process.env.OPENWEATHER_API_KEY;

  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
    const response = await axios.get(weatherUrl);
    const data = response.data;

    const html = `
      <html>
      <head><title>Weather</title><link rel="stylesheet" href="/style.css"></head>
      <body>
        <nav>
          <a href="/">Home</a>
          <a href="/weather">Weather</a>
          <a href="/aqi">AQI Monitor</a>
          <a href="/community">Community</a>
        </nav>

        <h1>Weather in ${data.name}</h1>
        <p>Temperature: ${data.main.temp}°C</p>
        <p>Condition: ${data.weather[0].description}</p>
        <p>Humidity: ${data.main.humidity}%</p>
      </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    res.send("<h1>Could not fetch weather.</h1>");
  }
});

module.exports = router;
