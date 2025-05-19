const express = require("express");
const axios = require("axios");
const path = require("path");
const router = express.Router();

// Route to serve weather.html page
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "weather.html"));
});

// API route to return weather data as JSON
router.get("/api/weather", async (req, res) => {
  const city = req.query.city || "Delhi";
  const apiKey = process.env.OPENWEATHER_API_KEY;

  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    const response = await axios.get(weatherUrl);
    const data = response.data;

    res.json({
      name: data.name,
      icon: data.weather[0].icon,
      temp: data.main.temp,
      condition: data.weather[0].description,
      humidity: data.main.humidity,
      wind: data.wind.speed
    });
  } catch (error) {
    console.error("Weather fetch error:", error.message);
    res.json({ error: "Unable to fetch weather. Try again later." });
  }
});

module.exports = router;
