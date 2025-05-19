require("dotenv").config();

const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3001;
const axios = require("axios");
const session = require("express-session");

// Import database connection and table creation from routes/database.js
const { createTables } = require("./routes/database");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Use session middleware
app.use(session({
  secret: "eco-secret-key", // Use a strong secret key in production
  resave: false,
  saveUninitialized: false,
}));

// Import routes
const indexRoutes = require("./routes/index");
const communityRoutes = require("./routes/community");
const weatherRoutes = require("./routes/weather");
const aqiRoutes = require("./routes/aqi");
const authRoutes = require("./routes/auth");
const locationRoutes = require("./routes/location");

// Use routes
app.use("/", indexRoutes);
app.use("/community", communityRoutes);
app.use("/weather", weatherRoutes);
app.use("/aqi", aqiRoutes);
app.use("/", authRoutes);
app.use("/location", locationRoutes);

app.get("/location-data", async (req, res) => {
  const { lat, lon } = req.query;
  const weatherKey = process.env.OPENWEATHER_API_KEY;
  const aqiKey = process.env.IQAIR_API_KEY;

  try {
    const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherKey}`);
    const aqiRes = await axios.get(`http://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${aqiKey}`);

    const weather = weatherRes.data;
    const aqi = aqiRes.data.data;

    res.json({
      city: weather.name,
      country: aqi.country,
      temp: weather.main.temp,
      description: weather.weather[0].description,
      aqi: aqi.current.pollution.aqius,
      pollutant: aqi.current.pollution.mainus
    });
  } catch (err) {
    console.error("Live Location Error:", err.message);
    res.status(500).json({ error: "Failed to fetch data." });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).send("Something went wrong!");
});

// Initialize DB tables before starting the server
createTables()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 EcoTrack is running at http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error("Failed to create tables or connect to DB:", err);
    process.exit(1); // Stop server startup on DB failure
  });

  