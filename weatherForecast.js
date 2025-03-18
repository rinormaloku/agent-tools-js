/**
 * Weather Forecast Tool
 * This tool retrieves weather information for a given location using a weather API
 */

const axios = require('axios');

/**
 * Weather forecast tool executor function
 * This function will be called when the agent uses the weatherForecast tool
 */
async function weatherForecastExecutor({
  location,
  units = 'metric',
  publishToClient,
}) {
  try {
    // If you want to publish progress or updates to the client
    if (publishToClient) {
      publishToClient({
        type: 'progress',
        data: {
          message: `Fetching weather data for ${location}...`,
          progress: 25
        }
      });
    }

    // First, get coordinates for the location using geocoding API
    const geocodeResponse = await axios.get(`https://geocoding-api.open-meteo.com/v1/search`, {
      params: {
        name: location,
        count: 1,
        language: 'en',
        format: 'json'
      }
    });

    if (!geocodeResponse.data.results || geocodeResponse.data.results.length === 0) {
      throw new Error(`Location "${location}" not found`);
    }

    const locationData = geocodeResponse.data.results[0];
    const { latitude, longitude, name, country_code } = locationData;

    // Use Open-Meteo API for weather data - no API key required
    const response = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
      params: {
        latitude: latitude,
        longitude: longitude,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,cloud_cover',
        temperature_unit: units === 'metric' ? 'celsius' : 'fahrenheit',
        wind_speed_unit: units === 'metric' ? 'ms' : 'mph',
        timezone: 'auto'
      }
    });

    const weatherData = response.data;

    // Update progress
    if (publishToClient) {
      publishToClient({
        type: 'progress',
        data: {
          message: `Processing weather information...`,
          progress: 75
        }
      });
    }

    // Convert weather code to description and icon
    const weatherCodeMap = {
      0: { description: 'Clear sky', icon: '01d' },
      1: { description: 'Mainly clear', icon: '02d' },
      2: { description: 'Partly cloudy', icon: '03d' },
      3: { description: 'Overcast', icon: '04d' },
      45: { description: 'Fog', icon: '50d' },
      48: { description: 'Depositing rime fog', icon: '50d' },
      51: { description: 'Light drizzle', icon: '09d' },
      53: { description: 'Moderate drizzle', icon: '09d' },
      55: { description: 'Dense drizzle', icon: '09d' },
      61: { description: 'Slight rain', icon: '10d' },
      63: { description: 'Moderate rain', icon: '10d' },
      65: { description: 'Heavy rain', icon: '10d' },
      71: { description: 'Slight snow fall', icon: '13d' },
      73: { description: 'Moderate snow fall', icon: '13d' },
      75: { description: 'Heavy snow fall', icon: '13d' },
      95: { description: 'Thunderstorm', icon: '11d' },
      96: { description: 'Thunderstorm with slight hail', icon: '11d' },
      99: { description: 'Thunderstorm with heavy hail', icon: '11d' }
    };

    const weatherInfo = weatherCodeMap[weatherData.current.weather_code] ||
      { description: 'Unknown', icon: '03d' };

    // Format the weather data for easier consumption
    const formattedData = {
      location: {
        name: name,
        country: country_code,
        coordinates: {
          lat: latitude,
          lon: longitude
        }
      },
      current: {
        temperature: weatherData.current.temperature_2m,
        feels_like: weatherData.current.apparent_temperature,
        humidity: weatherData.current.relative_humidity_2m,
        pressure: weatherData.current.pressure_msl,
        description: weatherInfo.description,
        icon: weatherInfo.icon,
        wind: {
          speed: weatherData.current.wind_speed_10m,
          direction: weatherData.current.wind_direction_10m
        },
        cloudiness: weatherData.current.cloud_cover,
        timestamp: weatherData.current.time
      },
      units: units === 'metric' ? {
        temperature: '°C',
        wind: 'm/s'
      } : {
        temperature: '°F',
        wind: 'mph'
      }
    };

    // Complete the task
    if (publishToClient) {
      publishToClient({
        type: 'progress',
        data: {
          message: `Weather data retrieved successfully!`,
          progress: 100
        }
      });
    }

    // Return the result as a JSON string
    return JSON.stringify({
      data: formattedData
    });
  } catch (error) {
    console.error('Weather forecast error:', error);

    // Handle errors and return them as a structured JSON response
    return JSON.stringify({
      error: {
        message: error.message || 'Failed to retrieve weather data',
        details: error.response?.data || null
      }
    });
  }
}

/**
 * Weather forecast tool definition
 * This follows the ToolDefinition interface from @agentframework/core
 */
const weatherForecastTool = {
  name: 'weather-forecast',
  toolDefinition: {
    type: 'function',
    function: {
      name: 'weather-forecast',
      description: 'Get current weather information for a specific location',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The location to get weather data for (city name, city and country code)',
          },
          units: {
            type: 'string',
            description: 'Units of measurement: metric (Celsius) or imperial (Fahrenheit)',
            enum: ['metric', 'imperial'],
            default: 'metric'
          }
        },
        required: ['location', 'units'],
        additionalProperties: false,
      },
    },
  },
  executor: weatherForecastExecutor,
};

// Export the tool so it can be loaded by the ToolLoader
module.exports = {
  weatherForecastTool,
};
