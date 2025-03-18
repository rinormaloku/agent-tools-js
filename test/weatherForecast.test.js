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

  test('successfully retrieves weather data for a location', async () => {
    // Mock the API response with realistic weather data
    axios.get.mockResolvedValueOnce({
      data: {
        name: 'London',
        sys: {
          country: 'GB'
        },
        coord: {
          lat: 51.51,
          lon: -0.13
        },
        main: {
          temp: 15.2,
          feels_like: 14.8,
          humidity: 76,
          pressure: 1015
        },
        weather: [
          {
            description: 'partly cloudy',
            icon: '02d'
          }
        ],
        wind: {
          speed: 4.1,
          deg: 250
        },
        clouds: {
          all: 40
        },
        dt: Math.floor(Date.now() / 1000)
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
    expect(response.data.current.description).toBe('partly cloudy');
    expect(response.data.units.temperature).toBe('°C');

    // Verify progress updates were sent
    expect(mockPublishToClient).toHaveBeenCalledTimes(3);
    expect(mockPublishToClient.mock.calls[0][0].data.progress).toBe(25);
    expect(mockPublishToClient.mock.calls[1][0].data.progress).toBe(75);
    expect(mockPublishToClient.mock.calls[2][0].data.progress).toBe(100);
  });

  test('handles API errors gracefully', async () => {
    // Mock API failure
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

  test('retrieves weather data with imperial units', async () => {
    // Mock the API response with imperial units
    axios.get.mockResolvedValueOnce({
      data: {
        name: 'New York',
        sys: {
          country: 'US'
        },
        coord: {
          lat: 40.71,
          lon: -74.01
        },
        main: {
          temp: 68.5,
          feels_like: 70.2,
          humidity: 65,
          pressure: 1012
        },
        weather: [
          {
            description: 'clear sky',
            icon: '01d'
          }
        ],
        wind: {
          speed: 8.5,
          deg: 270
        },
        clouds: {
          all: 5
        },
        dt: Math.floor(Date.now() / 1000)
      }
    });

    const result = await weatherForecastTool.executor({
      location: 'New York',
      units: 'imperial',
      publishToClient: mockPublishToClient
    });

    const response = parseResponse(result);

    // Verify imperial units are correctly processed
    expect(response.data).toBeDefined();
    expect(response.data.location.name).toBe('New York');
    expect(response.data.current.temperature).toBe(68.5);
    expect(response.data.current.description).toBe('clear sky');
    expect(response.data.units.temperature).toBe('°F');
    expect(response.data.units.wind).toBe('mph');
  });

  test('handles invalid location response', async () => {
    // Mock API response for invalid location
    axios.get.mockRejectedValueOnce({
      response: {
        data: {
          cod: '404',
          message: 'city not found'
        }
      }
    });

    const result = await weatherForecastTool.executor({
      location: 'NonExistentCity',
      units: 'metric'
    });

    const response = parseResponse(result);

    // Verify error handling for invalid location
    expect(response.error).toBeDefined();
    expect(response.data).toBeUndefined();
    expect(response.error.details).toEqual({ cod: '404', message: 'city not found' });
  });
});
