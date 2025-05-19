const express = require("express");
const axios = require("axios");
const path = require("path");
const router = express.Router();

// Serve the static AQI HTML page
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "aqi.html"));
});

// Provide AQI data as JSON
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
