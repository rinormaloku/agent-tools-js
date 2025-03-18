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

    // Use OpenWeatherMap API for weather data
    // Note: You should replace this with your own API key in production
    const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY';
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: {
        q: location,
        units: units,
        appid: API_KEY
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

    // Format the weather data for easier consumption
    const formattedData = {
      location: {
        name: weatherData.name,
        country: weatherData.sys.country,
        coordinates: {
          lat: weatherData.coord.lat,
          lon: weatherData.coord.lon
        }
      },
      current: {
        temperature: weatherData.main.temp,
        feels_like: weatherData.main.feels_like,
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        wind: {
          speed: weatherData.wind.speed,
          direction: weatherData.wind.deg
        },
        cloudiness: weatherData.clouds.all,
        timestamp: new Date(weatherData.dt * 1000).toISOString()
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
