import React, { useEffect, useState } from 'react';
import { weatherService } from '../../pages/services/weatherService';
import { CloudSun, Wind, Droplets, Thermometer, AlertCircle, CloudRain, Sun, Cloud, CloudLightning } from 'lucide-react';

const WeatherWidget = ({ destination }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await weatherService.getWeatherByDestination(destination);
        if (active) {
          setWeather(data);
        }
      } catch (err) {
        if (active) {
          setError('Could not retrieve weather forecast.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchWeather();
    return () => { active = false; };
  }, [destination]);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl border-slate-800 animate-pulse flex flex-col items-center justify-center min-h-[200px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mb-3"></div>
        <p className="text-xs text-slate-500 font-mono">Querying OpenWeather API...</p>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="glass-panel p-6 rounded-2xl border-slate-800 flex items-center gap-3 text-sm text-slate-400">
        <AlertCircle className="h-5 w-5 text-rose-500" />
        <span>{error || 'Weather details unavailable.'}</span>
      </div>
    );
  }

  // Get icon for the current weather description
  const getWeatherIcon = (description = '') => {
    const desc = description.toLowerCase();
    if (desc.includes('rain') || desc.includes('shower')) return <CloudRain className="h-10 w-10 text-cyan-400" />;
    if (desc.includes('storm') || desc.includes('thunder')) return <CloudLightning className="h-10 w-10 text-amber-500" />;
    if (desc.includes('clear') || desc.includes('sun')) return <Sun className="h-10 w-10 text-amber-400" />;
    if (desc.includes('cloud')) return <CloudSun className="h-10 w-10 text-slate-300" />;
    return <Cloud className="h-10 w-10 text-slate-400" />;
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h4 className="font-bold text-slate-100 font-display">Local Weather Update</h4>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{destination}</p>
        </div>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-900/60 px-2 py-0.5 rounded-full uppercase">
          Live
        </span>
      </div>

      {/* Main Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {getWeatherIcon(weather.description)}
          <div>
            <div className="flex items-start">
              <span className="text-3xl font-extrabold font-display text-slate-100">{weather.temp}</span>
              <span className="text-cyan-400 text-sm font-semibold">°C</span>
            </div>
            <p className="text-slate-300 text-xs font-semibold capitalize mt-0.5">{weather.description}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-400 bg-slate-900/40 px-4 py-3 rounded-xl border border-slate-800/40">
          <div className="flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-cyan-500" />
            <span>Hum: {weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="h-3.5 w-3.5 text-cyan-500" />
            <span>Wind: {weather.wind} km/h</span>
          </div>
        </div>
      </div>

      {/* 3-Day Forecast */}
      <div className="border-t border-slate-900 pt-4 space-y-3">
        <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">3-Day Tour Forecast</h5>
        <div className="grid grid-cols-3 gap-3">
          {weather.forecast.map((fc, i) => (
            <div key={i} className="flex flex-col items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-900 text-center space-y-1">
              <span className="text-[10px] font-semibold text-slate-400">{fc.day}</span>
              {getWeatherIcon(fc.description)}
              <span className="text-xs font-bold text-slate-200">{fc.temp}°C</span>
              <span className="text-[9px] text-slate-500 capitalize line-clamp-1">{fc.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
