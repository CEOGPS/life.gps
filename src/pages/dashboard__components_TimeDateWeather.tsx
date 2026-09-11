import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, Wind, CloudSnow, CloudLightning, CloudDrizzle, CloudFog } from "lucide-react";

const WEATHER_ICONS = {
  // Clear
  0: { icon: Sun, label: "Clear", emoji: "☀️" },
  // Mainly clear
  1: { icon: Sun, label: "Mainly Clear", emoji: "🌤️" },
  // Partly cloudy
  2: { icon: Cloud, label: "Partly Cloudy", emoji: "⛅" },
  // Overcast
  3: { icon: Cloud, label: "Overcast", emoji: "☁️" },
  // Fog
  45: { icon: CloudFog, label: "Fog", emoji: "🌫️" },
  48: { icon: CloudFog, label: "Depositing Rime Fog", emoji: "🌫️" },
  // Drizzle
  51: { icon: CloudDrizzle, label: "Light Drizzle", emoji: "🌦️" },
  53: { icon: CloudDrizzle, label: "Moderate Drizzle", emoji: "🌦️" },
  55: { icon: CloudDrizzle, label: "Dense Drizzle", emoji: "🌧️" },
  56: { icon: CloudDrizzle, label: "Light Freezing Drizzle", emoji: "🌧️" },
  57: { icon: CloudDrizzle, label: "Dense Freezing Drizzle", emoji: "🌧️" },
  // Rain
  61: { icon: CloudRain, label: "Slight Rain", emoji: "🌧️" },
  63: { icon: CloudRain, label: "Moderate Rain", emoji: "🌧️" },
  65: { icon: CloudRain, label: "Heavy Rain", emoji: "🌧️" },
  66: { icon: CloudRain, label: "Light Freezing Rain", emoji: "🌧️" },
  67: { icon: CloudRain, label: "Heavy Freezing Rain", emoji: "🌧️" },
  // Snow
  71: { icon: CloudSnow, label: "Slight Snow", emoji: "❄️" },
  73: { icon: CloudSnow, label: "Moderate Snow", emoji: "❄️" },
  75: { icon: CloudSnow, label: "Heavy Snow", emoji: "❄️" },
  77: { icon: CloudSnow, label: "Snow Grains", emoji: "❄️" },
  // Rain showers
  80: { icon: CloudRain, label: "Slight Rain Showers", emoji: "🌦️" },
  81: { icon: CloudRain, label: "Moderate Rain Showers", emoji: "🌦️" },
  82: { icon: CloudRain, label: "Violent Rain Showers", emoji: "🌧️" },
  // Snow showers
  85: { icon: CloudSnow, label: "Slight Snow Showers", emoji: "❄️" },
  86: { icon: CloudSnow, label: "Heavy Snow Showers", emoji: "❄️" },
  // Thunderstorm
  95: { icon: CloudLightning, label: "Thunderstorm", emoji: "⛈️" },
  96: { icon: CloudLightning, label: "Thunderstorm with Slight Hail", emoji: "⛈️" },
  99: { icon: CloudLightning, label: "Thunderstorm with Heavy Hail", emoji: "⛈️" },
};

export default function TimeDateWeather() {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    
    // Fetch weather on mount and every 10 minutes
    const fetchWeather = async () => {
      try {
        // Use Atlanta coordinates as default (user is in Atlanta, GA)
        const response = await fetch("/api/weather?latitude=33.749&longitude=-84.388");
        if (response.ok) {
          const data = await response.json();
          setWeather(data.current);
        }
      } catch (e) {
        console.warn("Weather fetch failed:", e);
      }
    };
    
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 10 * 60 * 1000);
    
    return () => {
      clearInterval(t);
      clearInterval(weatherInterval);
    };
  }, []);

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const hours = time.getHours().toString().padStart(2, "0");
  const mins = time.getMinutes().toString().padStart(2, "0");
  const secs = time.getSeconds().toString().padStart(2, "0");
  const dayName = days[time.getDay()];
  const dateStr = `${months[time.getMonth()]} ${time.getDate()}, ${time.getFullYear()}`;

  // Get weather info
  let weatherInfo = { icon: Sun, label: "Loading...", emoji: "🌤️", temp: "--", humidity: "--", wind: "--", uv: "--" };
  
  if (weather) {
    const code = weather.weather_code;
    const info = WEATHER_ICONS[code] || WEATHER_ICONS[0];
    weatherInfo = {
      icon: info.icon,
      label: info.label,
      emoji: info.emoji,
      temp: `${Math.round(weather.temperature_2m * 9/5 + 32)}°F`,
      humidity: `${weather.relative_humidity_2m}%`,
      wind: `${Math.round(weather.wind_speed_10m * 2.237)} mph`,
      uv: weather.uv_index !== undefined ? weather.uv_index.toFixed(1) : "--",
    };
  }

  const WeatherIcon = weatherInfo.icon;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Time */}
      <div className="text-center">
        <div className="font-display text-4xl text-white/90 tracking-widest text-glow">
          {hours}:{mins}
          <span className="text-xl text-primary/80 ml-1">{secs}</span>
        </div>
        <div className="text-xs text-white/30 tracking-[0.2em] font-display mt-1">
          {dayName}
        </div>
        <div className="text-sm text-white/50 tracking-wider mt-0.5">
          {dateStr}
        </div>
      </div>

      {/* Weather */}
      <div className="glass-crimson rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-3">
          <WeatherIcon size={24} className="text-primary/80" />
          <div>
            <div className="text-2xl font-display">{weatherInfo.emoji} {weatherInfo.temp}</div>
            <div className="text-[10px] text-white/30 tracking-wider">{weatherInfo.label}</div>
          </div>
        </div>
        <div className="flex justify-around mt-3 border-t border-white/5 pt-2">
          <div className="text-center">
            <div className="text-[10px] text-white/20">Humidity</div>
            <div className="text-xs text-white/40">{weatherInfo.humidity}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-white/20">Wind</div>
            <div className="text-xs text-white/40">{weatherInfo.wind}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-white/20">UV Index</div>
            <div className="text-xs text-white/40">{weatherInfo.uv}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
