import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import { weatherService } from '../../pages/services/weatherService';
import { CloudSun, Wind, Droplets, Thermometer, AlertCircle, CloudRain, Sun, Cloud, CloudLightning } from 'lucide-react';
=======
import { weatherService } from '../../services/weatherService';
import { CloudSun, Wind, Droplets, AlertCircle, CloudRain, Sun, Cloud, CloudLightning, Calendar, Sparkles } from 'lucide-react';
>>>>>>> 44ad24f098897339e6f1ec785ced06dfa05fa61a

const WeatherWidget = ({ destination, tourDate, durationDays = 3, theme = 'light' }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        let data;
        if (tourDate) {
          data = await weatherService.getWeatherForDate(destination, tourDate, durationDays);
        } else {
          data = await weatherService.getWeatherByDestination(destination);
        }

        if (active) {
          setWeatherData(data);
          if (tourDate) {
            setIsFlashing(true);
            const timer = setTimeout(() => setIsFlashing(false), 1200);
            return () => clearTimeout(timer);
          }
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

    if (destination || tourDate) {
      fetchWeather();
    }

    return () => { active = false; };
  }, [destination, tourDate, durationDays]);

  const getWeatherIcon = (description = '', size = 'md') => {
    const desc = (description || '').toLowerCase();
    const sizeClasses = size === 'lg' ? 'h-10 w-10 shrink-0' : size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';

    if (desc.includes('thunder') || desc.includes('storm')) {
      return <CloudLightning className={`${sizeClasses} text-amber-600`} />;
    }
    if (desc.includes('rain') || desc.includes('shower') || desc.includes('drizzle')) {
      return <CloudRain className={`${sizeClasses} text-sky-600`} />;
    }
    if (desc.includes('clear') || desc.includes('sun')) {
      return <Sun className={`${sizeClasses} text-amber-500`} />;
    }
    if (desc.includes('cloud')) {
      return <CloudSun className={`${sizeClasses} text-stone-500`} />;
    }
    return <Cloud className={`${sizeClasses} text-stone-400`} />;
  };

  const isDark = theme === 'dark';

  const containerStyle = {
    background: isDark ? '#0f172a' : '#ffffff',
    border: `1px solid ${isDark ? '#1e293b' : '#e0dbd0'}`,
    borderRadius: '6px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    transition: 'all 0.3s ease',
  };

  const flashAnimationStyle = isFlashing
    ? {
      animation: 'weatherFlashPulse 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
    }
    : {};

  if (!tourDate && !weatherData && !loading) {
    return (
      <div className="p-5 rounded-md border text-center text-xs space-y-1.5" style={{ background: '#fcfbf9', borderColor: '#eae5db', color: '#6b6255' }}>
        <Calendar className="w-5 h-5 mx-auto opacity-70 text-amber-700" />
        <p className="font-semibold text-stone-800">Travel Weather Forecast</p>
        <p className="text-[11px] text-stone-500">Please select your travel date to preview predicted weather for your trip.</p>
      </div>
    );
  }

  const travelDateFormatted = tourDate
    ? new Date(`${tourDate}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : weatherData?.primary?.dayLabel || 'Select Date';

  return (
    <div
      className={`p-6 relative overflow-hidden transition-all ${isFlashing ? 'ring-2 ring-amber-700/30' : ''}`}
      style={{ ...containerStyle, ...flashAnimationStyle }}
    >
      <style>{`
        @keyframes weatherFlashPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(107, 98, 85, 0.4);
            transform: scale(0.985);
            background-color: #f7f4ef;
          }
          50% {
            box-shadow: 0 0 24px 6px rgba(107, 98, 85, 0.25);
            transform: scale(1.015);
            background-color: #faf7f2;
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
            transform: scale(1);
          }
        }
      `}</style>

      {/* 1. Header */}
      <div className="flex items-start justify-between pb-4 border-b" style={{ borderColor: isDark ? '#1e293b' : '#eae5db' }}>
        <div>

          <h3 className="text-base font-extrabold mt-0.5" style={{ color: isDark ? '#94a3b8' : '#6b6255' }}>
            {destination || 'Destination'}
          </h3>
        </div>
        {weatherData && (
          <span
            className="text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shrink-0 mt-0.5"
            style={{
              background: weatherData.isLiveForecast ? 'rgba(255, 255, 255, 0.1)' : 'rgba(217, 119, 6, 0.1)',
              color: weatherData.isLiveForecast ? '#047857' : '#b45309',
              border: `1px solid ${weatherData.isLiveForecast ? 'rgba(16, 185, 129, 0.3)' : 'rgba(217, 119, 6, 0.3)'}`,
            }}
          >
            {weatherData.isLiveForecast ? 'PREDICTED FORECAST' : 'SEASONAL OUTLOOK'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center space-y-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-700 border-t-transparent"></div>
          <p className="text-[11px] font-medium text-stone-500">Predicting weather for selected dates...</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-xs py-4 text-rose-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : weatherData ? (
        <div className="space-y-4 pt-4">

          {/* 2. Main Selected Date Weather Row */}
          {weatherData.primary && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                {getWeatherIcon(weatherData.primary.description, 'lg')}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-sans" style={{ color: isDark ? '#f8fafc' : '#1a1a1a' }}>
                      {weatherData.primary.tempMax ?? weatherData.primary.temp ?? '--'}°C
                    </span>
                    {weatherData.primary.tempMin !== undefined && (
                      <span className="text-sm font-medium" style={{ color: isDark ? '#94a3b8' : '#6b6255' }}>
                        / {weatherData.primary.tempMin}°C
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold capitalize mt-0.5" style={{ color: isDark ? '#cbd5e1' : '#45403a' }}>
                    {weatherData.primary.description}
                  </p>
                </div>
              </div>

              <div className="text-right text-[11px] space-y-1.5 font-medium" style={{ color: isDark ? '#94a3b8' : '#45403a' }}>
                <div className="flex items-center justify-end gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-500" />
                  <span>Rain: {weatherData.primary.rainChance ?? 15}%</span>
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-stone-400" />
                  <span>Wind: {weatherData.primary.windSpeed ?? 12} km/h</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Travel Date Row */}
          <div className="pt-3 pb-1 flex items-center justify-between border-t border-b text-xs" style={{ borderColor: isDark ? '#1e293b' : '#eae5db' }}>
            <span className="flex items-center gap-1.5 font-medium" style={{ color: isDark ? '#94a3b8' : '#6b6255' }}>
              <Calendar className="w-4 h-4 text-stone-500" />
              Travel Date:
            </span>
            <span className="font-bold text-sm" style={{ color: isDark ? '#f8fafc' : '#1a1a1a' }}>
              {travelDateFormatted}
            </span>
          </div>

          {/* 4. Full Days Forecast Breakdown (N-Day Tour Scope) */}
          {weatherData.days && weatherData.days.length > 0 && (
            <div className="pt-2 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isDark ? '#94a3b8' : '#6b6255' }}>
                {weatherData.days.length}-DAY TOUR FORECAST
              </h4>
              <div className={`grid gap-2.5 ${weatherData.days.length >= 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                {weatherData.days.map((dayItem, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-md text-center space-y-1.5 transition-all"
                    style={{
                      background: isDark ? '#1e293b' : '#fcfbf9',
                      border: `1px solid ${isDark ? '#334155' : '#eae5db'}`,
                    }}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wide" style={{ color: isDark ? '#cbd5e1' : '#45403a' }}>
                      Day {idx + 1}
                    </span>
                    <div className="flex justify-center my-1">{getWeatherIcon(dayItem.description, 'sm')}</div>
                    <span className="block text-xs font-extrabold" style={{ color: isDark ? '#f8fafc' : '#1a1a1a' }}>
                      {dayItem.tempMax}°C
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : null}
    </div>
  );
};

export default WeatherWidget;


