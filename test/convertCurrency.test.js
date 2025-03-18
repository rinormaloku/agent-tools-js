/**
 * End-to-end tests for the currency conversion tool
 */
const { convertCurrencyTool } = require('../convertCurrency');
const axios = require('axios');

// Mock axios for controlled testing
jest.mock('axios');

describe('Currency Conversion Tool E2E Tests', () => {
  // Helper function to parse the JSON string returned by the tool
  const parseResponse = (jsonString) => JSON.parse(jsonString);

  // Mock publishToClient function to capture progress updates
  const mockPublishToClient = jest.fn();

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('successfully converts USD to EUR', async () => {
    // Mock the API response with realistic exchange rate data
    axios.get.mockResolvedValueOnce({
      data: {
        base: 'USD',
        rates: { EUR: 0.85, GBP: 0.75, JPY: 110.2 },
        time_last_updated: Date.now() / 1000
      }
    });

    const result = await convertCurrencyTool.executor({
      amount: 100,
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      publishToClient: mockPublishToClient
    });

    const response = parseResponse(result);

    // Verify the conversion was successful
    expect(response.data).toBeDefined();
    expect(response.error).toBeUndefined();
    expect(response.data.amount).toBe(85);
    expect(response.data.fromCurrency).toBe('USD');
    expect(response.data.toCurrency).toBe('EUR');
    expect(response.data.rate).toBe(0.85);
    expect(response.data.equivalentString).toBe('100 USD = 85 EUR');

    // Verify progress updates were sent
    expect(mockPublishToClient).toHaveBeenCalledTimes(3);
    expect(mockPublishToClient.mock.calls[0][0].data.progress).toBe(25);
    expect(mockPublishToClient.mock.calls[1][0].data.progress).toBe(75);
    expect(mockPublishToClient.mock.calls[2][0].data.progress).toBe(100);
  });

  test('handles API errors gracefully', async () => {
    // Mock API failure
    axios.get.mockRejectedValueOnce(new Error('Network error'));

    const result = await convertCurrencyTool.executor({
      amount: 100,
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      publishToClient: mockPublishToClient
    });

    const response = parseResponse(result);

    // Verify error handling
    expect(response.error).toBeDefined();
    expect(response.data).toBeUndefined();
    expect(response.error.message).toBe('Network error');
  });

  test('handles unsupported currency', async () => {
    // Mock API response with missing target currency
    axios.get.mockResolvedValueOnce({
      data: {
        base: 'USD',
        rates: { EUR: 0.85, GBP: 0.75 }
      }
    });

    const result = await convertCurrencyTool.executor({
      amount: 100,
      fromCurrency: 'USD',
      toCurrency: 'XYZ', // Unsupported currency
      publishToClient: mockPublishToClient
    });

    const response = parseResponse(result);

    // Verify error handling for unsupported currency
    expect(response.error).toBeDefined();
    expect(response.data).toBeUndefined();
    expect(response.error.message).toBe('Conversion to XYZ is not supported');
  });

  test('converts with decimal precision', async () => {
    // Mock API response with specific exchange rate
    axios.get.mockResolvedValueOnce({
      data: {
        base: 'USD',
        rates: { EUR: 0.8537 }
      }
    });

    const result = await convertCurrencyTool.executor({
      amount: 123.45,
      fromCurrency: 'USD',
      toCurrency: 'EUR'
    });

    const response = parseResponse(result);

    // Verify decimal precision (should be rounded to 2 decimal places)
    expect(response.data.amount).toBe(105.39); // 123.45 * 0.8537 = 105.389065, rounded to 105.39
  });
});
