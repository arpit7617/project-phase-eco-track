// Load environment variables from .env file at the very top
require("dotenv").config();

const express = require("express");
const path = require("path");
const axios = require("axios");
const session = require("express-session");

const app = express();
const port = process.env.PORT || 3001;

// Import database setup
const { createTables } = require("./routes/database");

// Set up the view engine (if using EJS, Pug, etc.)
app.set("view engine", "ejs"); // optional, only if you plan to render views
app.set("views", path.join(__dirname, "views")); // optional

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Good for handling JSON in POST requests
app.use(express.static(path.join(__dirname, "public"))); // Better to use absolute path

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || "eco-secret-key", // Move secret to .env
  resave: false,
  saveUninitialized: false,
}));

// Route imports
const indexRoutes = require("./routes/index");
const communityRoutes = require("./routes/community");
const weatherRoutes = require("./routes/weather");
const aqiRoutes = require("./routes/aqi");
const authRoutes = require("./routes/auth");
const locationRoutes = require("./routes/location");
const logsRoutes = require("./routes/logs");
<<<<<<< HEAD
const sustainabilityRouter = require('./routes/sustainability');
=======

>>>>>>> 5a65910c459a0cfcf7aa82f229b7a7e8a0edb5e8



// Route usage
app.use("/", indexRoutes);
app.use("/community", communityRoutes);
app.use("/weather", weatherRoutes);
app.use("/aqi", aqiRoutes);
app.use("/", authRoutes);
app.use("/location", locationRoutes);
app.use("/", logsRoutes);
<<<<<<< HEAD
app.use('/sustainability', sustainabilityRouter);
=======

>>>>>>> 5a65910c459a0cfcf7aa82f229b7a7e8a0edb5e8

// Live location API
app.get("/location-data", async (req, res) => {
  const { lat, lon } = req.query;
  const weatherKey = process.env.OPENWEATHER_API_KEY;
  const aqiKey = process.env.IQAIR_API_KEY;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Latitude and Longitude are required." });
  }

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
    res.status(500).json({ error: "Failed to fetch location data." });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).send("Something went wrong!");
});

// Start server after DB setup
createTables()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 EcoTrack is running at http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error("Failed to create tables or connect to DB:", err);
    process.exit(1);
  });
