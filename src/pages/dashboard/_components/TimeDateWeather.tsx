import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, Wind, Droplets } from "lucide-react";

const CITY = "Atlanta";

async function geoLookup(
  q: string,
): Promise<{ lat: number; lon: number; name: string } | null> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`,
  );
  if (!res.ok) return null;
  const data = await res.json();
  const hit = data?.results?.[0];
  if (!hit) return null;
  const parts = [hit.name, hit.admin1, hit.country].filter(Boolean);
  return {
    lat: hit.latitude,
    lon: hit.longitude,
    name: parts.join(", "),
  };
}

async function fetchWeatherData(lat: number, lon: number): Promise<any> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index",
    timezone: "auto",
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
  return response.json();
}

function conditionFromCode(code: number): {
  text: string;
  emoji: string;
  icon: React.ReactNode;
} {
  if (code === 0) return { text: "Clear", emoji: "☀️", icon: <Sun size={48} className="text-yellow-400 drop-shadow-[0_0_20px_rgba(255,200,0,0.6)]" /> };
  if ([1, 2, 3].includes(code)) {
    if (code === 1) return { text: "Partly Cloudy", emoji: "🌤️", icon: <Cloud size={48} className="text-yellow-400" /> };
    if (code === 2) return { text: "Mostly Cloudy", emoji: "☁️", icon: <Cloud size={48} className="text-white/60" /> };
    return { text: "Overcast", emoji: "☁️", icon: <Cloud size={48} className="text-white/50" /> };
  }
  if ([45, 48].includes(code)) return { text: "Fog", emoji: "🌫️", icon: <Cloud size={48} className="text-white/40" /> };
  if ([51, 53, 55, 56, 57].includes(code)) return { text: "Drizzle", emoji: "🌧️", icon: <CloudRain size={48} className="text-blue-400" /> };
  if ([61, 63, 65, 66, 67].includes(code)) return { text: "Rain", emoji: "🌧️", icon: <CloudRain size={48} className="text-blue-400 drop-shadow-[0_0_20px_rgba(100,150,255,0.6)]" /> };
  if ([71, 73, 75, 77].includes(code)) return { text: "Snow", emoji: "❄️", icon: <CloudRain size={48} className="text-blue-300" /> };
  if ([80, 81, 82].includes(code)) return { text: "Rain Showers", emoji: "🌧️", icon: <CloudRain size={48} className="text-blue-400" /> };
  if ([85, 86].includes(code)) return { text: "Snow Showers", emoji: "❄️", icon: <CloudRain size={48} className="text-blue-300" /> };
  if ([95, 96, 99].includes(code)) return { text: "Thunderstorm", emoji: "⛈️", icon: <CloudRain size={48} className="text-yellow-400 drop-shadow-[0_0_20px_rgba(255,200,0,0.6)]" /> };
  return { text: "Unknown", emoji: "☁️", icon: <Cloud size={48} className="text-white/50" /> };
}

export default function TimeDateWeather() {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<{
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    uvIndex: number;
    emoji: string;
    icon: React.ReactNode;
    location: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        const geo = await geoLookup(CITY);
        if (!geo) throw new Error("Could not locate city");

        const data = await fetchWeatherData(geo.lat, geo.lon);
        const cur = data?.current;
        if (!cur) throw new Error("No weather data");

        if (!cancelled) {
          const cond = conditionFromCode(cur.weather_code);
          setWeather({
            temperature: Math.round(cur.temperature_2m * 9 / 5 + 32),
                        condition: cond.text,
                        humidity: cur.relative_humidity_2m,
                        windSpeed: Math.round(cur.wind_speed_10m * 0.621371),
                        uvIndex: Math.round(cur.uv_index || 0),
                        emoji: cond.emoji,
                        icon: cond.icon,
                        location: geo.name,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch weather");
          console.warn("[TimeDateWeather] Weather fetch failed:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const hours24 = time.getHours();
    const mins = time.getMinutes().toString().padStart(2, "0");
    const secs = time.getSeconds().toString().padStart(2, "0");
    const dayName = days[time.getDay()];
    const dateStr = `${months[time.getMonth()]} ${time.getDate()}, ${time.getFullYear()}`;

    // Convert to 12-hour format
    const ampm = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12;
    const hours = hours12.toString().padStart(2, "0");

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Time - Large digital signage style */}
            <div className="text-center">
              <div className="font-display text-6xl text-white/95 tracking-widest text-glow">
                {hours}:{mins}
                <span className="text-3xl text-primary/90 ml-1">{secs}</span>
                <span className="text-xl text-primary/70 ml-2">{ampm}</span>
              </div>
        <div className="text-sm text-white/40 tracking-[0.2em] font-display mt-1">
          {dayName}
        </div>
        <div className="text-base text-white/60 tracking-wider mt-0.5">
          {dateStr}
        </div>
      </div>

      {/* Weather - Digital signage style with large emoji */}
      <div className="glass-crimson rounded-lg p-4">
        {loading && !weather ? (
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin text-primary" style={{fontSize: '24px'}}>☀️</div>
            <div className="text-white/60 text-sm">Loading weather...</div>
          </div>
        ) : error && !weather ? (
          <div className="flex items-center justify-center gap-3 text-center">
            <span style={{fontSize: '24px'}}>☁️</span>
            <div>
              <div className="text-white/40 text-sm">Weather unavailable</div>
              <div className="text-[10px] text-white/20 mt-1">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-[10px] text-primary/60 hover:text-primary font-display tracking-wider underline"
              >
                Retry
              </button>
            </div>
          </div>
        ) : weather ? (
          <>
            <div className="flex items-center justify-center gap-6">
              {/* Large emoji weather icon */}
              <span style={{fontSize: '80px', lineHeight: 1}}>{weather.emoji}</span>
              <div className="text-center">
                <div className="text-5xl text-white/95 font-display">{weather.temperature}°F</div>
                <div className="text-sm text-white/60 capitalize mt-1">{weather.condition}</div>
              </div>
            </div>

            <div className="flex justify-around mt-4 border-t border-white/5 pt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Droplets size={12} className="text-blue-400" />
                  <span className="text-[11px] text-white/40">Humidity</span>
                </div>
                <div className="text-xl text-white/80 font-display">{weather.humidity}%</div>
              </div>
              <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Wind size={12} className="text-teal-400" />
                                <span className="text-[11px] text-white/40">Wind</span>
                              </div>
                              <div className="text-xl text-white/80 font-display">{weather.windSpeed} mph</div>
                            </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Sun size={12} className="text-orange-400" />
                  <span className="text-[11px] text-white/40">UV</span>
                </div>
                <div className="text-xl text-white/80 font-display">{weather.uvIndex}</div>
              </div>
            </div>

            <div className="mt-3 text-center">
              <div className="text-[11px] text-white/30 font-display tracking-wider">{weather.location}</div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <span style={{fontSize: '24px'}}>☀️</span>
            <div>
              <div className="text-2xl text-white/80 font-display">--°F</div>
              <div className="text-[10px] text-white/30 tracking-wider">Loading weather</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}