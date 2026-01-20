const API_KEY =

const majorCities = ["New York", "Los Angeles", "Chicago", "Houston", "Seattle"];

const particles = document.getElementById("particles");
const majorCitiesDiv = document.getElementById("majorCities");
const mainWeather = document.getElementById("mainWeather");
const hourly = document.getElementById("hourly");
const daily = document.getElementById("daily");
const favoritesDiv = document.getElementById("favorites");
const searchInput = document.getElementById("searchInput");

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

document.addEventListener("DOMContentLoaded", () => {
  loadMajorCities();
  renderFavorites();
});

/* ------------------ HELPERS ------------------ */

function clearParticles() {
  particles.innerHTML = "";
}

function setTheme(type) {
  document.body.className = type;
}

function icon(code, isNight) {
  if (code.includes("01")) return isNight ? "🌙" : "☀️";
  if (code.includes("02")) return "⛅";
  if (code.includes("03") || code.includes("04")) return "☁️";
  if (code.includes("09") || code.includes("10")) return "🌧️";
  if (code.includes("11")) return "⛈️";
  if (code.includes("13")) return "❄️";
  return "☁️";
}

/* ------------------ API ------------------ */

async function fetchWeather(city) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
  );
  return res.json();
}

async function fetchForecast(lat, lon) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  );
  return res.json();
}

/* ------------------ MAJOR CITIES ------------------ */

async function loadMajorCities() {
  majorCitiesDiv.innerHTML = "";
  for (let city of majorCities) {
    const data = await fetchWeather(city);
    const isNight = data.dt < data.sys.sunrise || data.dt > data.sys.sunset;

    majorCitiesDiv.innerHTML += `
      <div class="card fade" onclick="selectCity('${city}')">
        <h3>${city}</h3>
        <div style="font-size:40px">${icon(data.weather[0].icon, isNight)}</div>
        <b>${Math.round(data.main.temp)}°C</b>
      </div>
    `;
  }
}

/* ------------------ MAIN CITY ------------------ */

async function selectCity(city) {
  const data = await fetchWeather(city);
  renderMain(data);

  const forecast = await fetchForecast(data.coord.lat, data.coord.lon);
  renderForecast(forecast);

  document.getElementById("mainWeather").classList.remove("hidden");
  document.getElementById("hourlySection").classList.remove("hidden");
  document.getElementById("dailySection").classList.remove("hidden");
}

function searchCity() {
  const city = searchInput.value.trim();
  if (city) selectCity(city);
}

/* ------------------ RENDER MAIN ------------------ */

function renderMain(d) {
  const isNight = d.dt < d.sys.sunrise || d.dt > d.sys.sunset;
  const main = d.weather[0].main.toLowerCase();

  clearParticles();

  if (main.includes("rain")) setTheme("rain");
  else if (main.includes("snow")) setTheme("snow");
  else if (main.includes("thunder")) setTheme("thunder");
  else if (isNight) setTheme("night");
  else setTheme("sunny");

  mainWeather.innerHTML = `
    <div class="weather-card fade">
      <h2>${d.name}, ${d.sys.country}</h2>
      <div class="icon">${icon(d.weather[0].icon, isNight)}</div>
      <div class="temp">${Math.round(d.main.temp)}°C</div>
      <p>${d.weather[0].description}</p>
      <button onclick="addFavorite('${d.name}')">⭐ Add to Favorites</button>
    </div>
  `;
}

/* ------------------ FORECAST ------------------ */

function renderForecast(f) {
  hourly.innerHTML = "";
  daily.innerHTML = "";

  // 24 HOURS
  f.list.slice(0, 8).forEach(h => {
    const isNight = h.sys?.pod === "n";
    hourly.innerHTML += `
      <div class="card fade">
        ${new Date(h.dt * 1000).getHours()}:00<br>
        <span style="font-size:24px">${icon(h.weather[0].icon, isNight)}</span><br>
        ${Math.round(h.main.temp)}°C
      </div>
    `;
  });

  // 5 DAYS
  const days = {};
  f.list.forEach(x => {
    const d = new Date(x.dt * 1000).toDateString();
    if (!days[d]) days[d] = x;
  });

  Object.values(days).slice(0, 5).forEach(x => {
    const isNight = x.sys?.pod === "n";
    daily.innerHTML += `
      <div class="card fade">
        ${new Date(x.dt * 1000).toDateString().slice(0,10)}<br>
        <span style="font-size:24px">${icon(x.weather[0].icon, isNight)}</span><br>
        ${Math.round(x.main.temp)}°C
      </div>
    `;
  });
}

/* ------------------ FAVORITES ------------------ */

function addFavorite(city) {
  if (!favorites.includes(city)) {
    favorites.unshift(city);
    if (favorites.length > 5) favorites.pop();
    localStorage.setItem("favorites", JSON.stringify(favorites));
    renderFavorites();
  }
}

function renderFavorites() {
  favoritesDiv.innerHTML = "";
  favorites.forEach(city => {
    favoritesDiv.innerHTML += `
      <div class="card fade" onclick="selectCity('${city}')">
        ⭐ ${city}
      </div>
    `;
  });
}

/* ------------------ ANIMATION ------------------ */

const style = document.createElement("style");
style.innerHTML = `
.fade {
  animation: fadeIn 0.5s ease forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}`;
document.head.appendChild(style);
