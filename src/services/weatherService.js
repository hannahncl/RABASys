// OpenWeather API Client Integration with High-fidelity Mock Fallback

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Mock weather states for destinations in the Philippines
const MOCK_WEATHER_DATABASE = {
  'Daraga, Albay': {
    temp: 29,
    humidity: 75,
    wind: 10,
    description: 'partly cloudy',
    icon: '02d',
    forecast: [
      { day: 'Tomorrow', temp: 30, description: 'sunny', icon: '01d' },
      { day: 'Day 3', temp: 28, description: 'scattered clouds', icon: '03d' },
      { day: 'Day 4', temp: 29, description: 'light rain', icon: '10d' }
    ]
  },
  'Caramoan, Camarines Sur': {
    temp: 30,
    humidity: 78,
    wind: 12,
    description: 'clear sky',
    icon: '01d',
    forecast: [
      { day: 'Tomorrow', temp: 31, description: 'clear sky', icon: '01d' },
      { day: 'Day 3', temp: 30, description: 'few clouds', icon: '02d' },
      { day: 'Day 4', temp: 29, description: 'partly cloudy', icon: '02d' }
    ]
  },
  'Calaguas, Camarines Norte': {
    temp: 31,
    humidity: 72,
    wind: 15,
    description: 'sunny',
    icon: '01d',
    forecast: [
      { day: 'Tomorrow', temp: 32, description: 'sunny', icon: '01d' },
      { day: 'Day 3', temp: 31, description: 'clear sky', icon: '01d' },
      { day: 'Day 4', temp: 30, description: 'few clouds', icon: '02d' }
    ]
  },
  'Donsol, Sorsogon': {
    temp: 28,
    humidity: 80,
    wind: 11,
    description: 'few clouds',
    icon: '02d',
    forecast: [
      { day: 'Tomorrow', temp: 29, description: 'light rain', icon: '10d' },
      { day: 'Day 3', temp: 28, description: 'scattered clouds', icon: '03d' },
      { day: 'Day 4', temp: 29, description: 'sunny intervals', icon: '02d' }
    ]
  },
  'Matnog, Sorsogon': {
    temp: 30,
    humidity: 76,
    wind: 14,
    description: 'clear sky',
    icon: '01d',
    forecast: [
      { day: 'Tomorrow', temp: 30, description: 'clear sky', icon: '01d' },
      { day: 'Day 3', temp: 29, description: 'partly cloudy', icon: '02d' },
      { day: 'Day 4', temp: 30, description: 'light showers', icon: '10d' }
    ]
  }
};

const DEFAULT_MOCK = {
  temp: 28,
  humidity: 75,
  wind: 15,
  description: 'partly cloudy',
  icon: '02d',
  forecast: [
    { day: 'Tomorrow', temp: 29, description: 'clear sky', icon: '01d' },
    { day: 'Day 3', temp: 28, description: 'scattered clouds', icon: '03d' },
    { day: 'Day 4', temp: 27, description: 'rainy', icon: '10d' }
  ]
};

export const weatherService = {
  getWeatherByDestination: async (destinationName) => {
    // If API key is available, attempt real fetch
    if (API_KEY) {
      try {
        // Find main city from destination string (e.g. "El Nido, Palawan" -> "El Nido")
        const city = destinationName.split(',')[0].trim();
        const response = await fetch(
          `${BASE_URL}/weather?q=${encodeURIComponent(city)},PH&units=metric&appid=${API_KEY}`
        );
        if (response.ok) {
          const data = await response.json();
          
          // Now fetch forecast
          const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${encodeURIComponent(city)},PH&units=metric&cnt=24&appid=${API_KEY}`
          );
          let forecast = DEFAULT_MOCK.forecast;
          
          if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json();
            // Filter 1 forecast per day (every 8 items since items are 3-hour chunks)
            forecast = forecastData.list
              .filter((_, index) => index % 8 === 0)
              .slice(0, 3)
              .map((item, index) => {
                const date = new Date(item.dt * 1000);
                const dayLabel = index === 0 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long' });
                return {
                  day: dayLabel,
                  temp: Math.round(item.main.temp),
                  description: item.weather[0].description,
                  icon: item.weather[0].icon
                };
              });
          }

          return {
            temp: Math.round(data.main.temp),
            humidity: data.main.humidity,
            wind: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            forecast
          };
        }
      } catch (error) {
        console.warn('Failed to fetch from OpenWeather, falling back to mock weather data:', error);
      }
    }

    // Delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Look up mock database
    return MOCK_WEATHER_DATABASE[destinationName] || DEFAULT_MOCK;
  }
};
