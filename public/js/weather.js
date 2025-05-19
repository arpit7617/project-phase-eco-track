document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".weather-form");
  const weatherInfo = document.getElementById("weather-info");
  const cityElem = document.getElementById("city");
  const tempElem = document.getElementById("temp");
  const conditionElem = document.getElementById("condition");
  const humidityElem = document.getElementById("humidity");
  const windElem = document.getElementById("wind");
  const iconElem = document.getElementById("weather-icon");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cityInput = form.querySelector("input").value.trim();

    try {
      const res = await fetch(`/weather/api/weather?city=${encodeURIComponent(cityInput)}`);
      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      cityElem.textContent = data.name;
      tempElem.textContent = data.temp.toFixed(1);
      conditionElem.textContent = data.condition;
      humidityElem.textContent = data.humidity;
      document.getElementById("humidity-bar").style.width = `${data.humidity}%`;
      document.getElementById("wind-bar").style.width = `${Math.min(data.wind * 10, 100)}%`;

      windElem.textContent = data.wind;
      iconElem.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
      iconElem.alt = data.condition;

      weatherInfo.classList.remove("hidden");
    } catch (err) {
      console.error("❌ Weather fetch error:", err.message);
      alert("Failed to fetch weather data: " + err.message);
    }
  });
});
