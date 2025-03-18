/**
 * End-to-end tests for the weather forecast tool
 */
const { weatherForecastTool } = require('../weatherForecast');
const axios = require('axios');

// Mock axios for controlled testing
jest.mock('axios');

describe('Weather Forecast Tool E2E Tests', () => {
  // Helper function to parse the JSON string returned by the tool
  const parseResponse = (jsonString) => JSON.parse(jsonString);

  // Mock publishToClient function to capture progress updates
  const mockPublishToClient = jest.fn();

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('successfully fetches weather data for a valid location', async () => {
    // Mock the geocoding API response
    axios.get.mockImplementation((url, config) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return Promise.resolve({
          data: {
            results: [{
              name: 'London',
              country_code: 'GB',
              latitude: 51.5074,
              longitude: -0.1278
            }]
          }
        });
      } else if (url.includes('api.open-meteo.com')) {
        return Promise.resolve({
          data: {
            current: {
              temperature_2m: 15.2,
              relative_humidity_2m: 76,
              apparent_temperature: 14.8,
              precipitation: 0.1,
              weather_code: 3,
              pressure_msl: 1012.5,
              wind_speed_10m: 4.2,
              wind_direction_10m: 240,
              cloud_cover: 75,
              time: '2023-06-15T12:00:00Z'
            }
          }
        });
      }
    });

    const result = await weatherForecastTool.executor({
      location: 'London',
      units: 'metric',
      publishToClient: mockPublishToClient
    });

    const response = parseResponse(result);

    // Verify the weather data was retrieved successfully
    expect(response.data).toBeDefined();
    expect(response.error).toBeUndefined();
    expect(response.data.location.name).toBe('London');
    expect(response.data.location.country).toBe('GB');
    expect(response.data.current.temperature).toBe(15.2);
    expect(response.data.current.description).toBe('Overcast');
    expect(response.data.units.temperature).toBe('°C');

    // Verify progress updates were sent
    expect(mockPublishToClient).toHaveBeenCalledTimes(3);
    expect(mockPublishToClient.mock.calls[0][0].data.progress).toBe(25);
    expect(mockPublishToClient.mock.calls[1][0].data.progress).toBe(75);
    expect(mockPublishToClient.mock.calls[2][0].data.progress).toBe(100);
  });

  test('handles location not found error', async () => {
    // Mock geocoding API with empty results
    axios.get.mockImplementation((url) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return Promise.resolve({
          data: {
            results: []
          }
        });
      }
    });

    const result = await weatherForecastTool.executor({
      location: 'NonExistentPlace',
      units: 'metric',
      publishToClient: mockPublishToClient
    });

    const response = parseResponse(result);

    // Verify error handling for location not found
    expect(response.error).toBeDefined();
    expect(response.data).toBeUndefined();
    expect(response.error.message).toBe('Location "NonExistentPlace" not found');
  });

  test('handles API errors gracefully', async () => {
    // Mock geocoding API failure
    axios.get.mockRejectedValueOnce(new Error('Network error'));

    const result = await weatherForecastTool.executor({
      location: 'London',
      units: 'metric',
      publishToClient: mockPublishToClient
    });

    const response = parseResponse(result);

    // Verify error handling
    expect(response.error).toBeDefined();
    expect(response.data).toBeUndefined();
    expect(response.error.message).toBe('Network error');
  });

  test('correctly uses imperial units when specified', async () => {
    // Mock the geocoding API response
    axios.get.mockImplementation((url, config) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return Promise.resolve({
          data: {
            results: [{
              name: 'New York',
              country_code: 'US',
              latitude: 40.7128,
              longitude: -74.0060
            }]
          }
        });
      } else if (url.includes('api.open-meteo.com')) {
        // Verify imperial units are requested in the API call
        expect(config.params.temperature_unit).toBe('fahrenheit');
        expect(config.params.wind_speed_unit).toBe('mph');

        return Promise.resolve({
          data: {
            current: {
              temperature_2m: 70.5,
              relative_humidity_2m: 65,
              apparent_temperature: 72.1,
              precipitation: 0,
              weather_code: 1,
              pressure_msl: 1015.2,
              wind_speed_10m: 8.5,
              wind_direction_10m: 180,
              cloud_cover: 25,
              time: '2023-06-15T12:00:00Z'
            }
          }
        });
      }
    });

    const result = await weatherForecastTool.executor({
      location: 'New York',
      units: 'imperial',
      publishToClient: mockPublishToClient
    });

    const response = parseResponse(result);

    // Verify imperial units are used in the response
    expect(response.data.units.temperature).toBe('°F');
    expect(response.data.units.wind).toBe('mph');
  });

  test('correctly maps weather codes to descriptions', async () => {
    // Test a few different weather codes
    const weatherCodes = [
      { code: 0, description: 'Clear sky' },
      { code: 61, description: 'Slight rain' },
      { code: 95, description: 'Thunderstorm' }
    ];

    for (const weatherCode of weatherCodes) {
      jest.clearAllMocks();

      // Mock the API responses
      axios.get.mockImplementation((url) => {
        if (url.includes('geocoding-api.open-meteo.com')) {
          return Promise.resolve({
            data: {
              results: [{
                name: 'Test City',
                country_code: 'TC',
                latitude: 0,
                longitude: 0
              }]
            }
          });
        } else if (url.includes('api.open-meteo.com')) {
          return Promise.resolve({
            data: {
              current: {
                temperature_2m: 20,
                relative_humidity_2m: 50,
                apparent_temperature: 20,
                precipitation: 0,
                weather_code: weatherCode.code,
                pressure_msl: 1013,
                wind_speed_10m: 5,
                wind_direction_10m: 90,
                cloud_cover: 30,
                time: '2023-06-15T12:00:00Z'
              }
            }
          });
        }
      });

      const result = await weatherForecastTool.executor({
        location: 'Test City',
        units: 'metric',
      });

      const response = parseResponse(result);

      // Verify the weather description matches the code
      expect(response.data.current.description).toBe(weatherCode.description);
    }
  });
});
