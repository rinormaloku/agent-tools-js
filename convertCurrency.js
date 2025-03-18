/**
 * Currency Conversion Tool
 * This example tool converts amounts between different currencies using real exchange rates
 */

const axios = require('axios');

/**
 * Currency converter tool executor function
 * This function will be called when the agent uses the convertCurrency tool
 */
async function convertCurrencyExecutor({
  amount,
  fromCurrency,
  toCurrency,
  publishToClient,
}) {
  try {
    // If you want to publish progress or updates to the client
    if (publishToClient) {
      publishToClient({
        type: 'progress',
        data: {
          message: `Fetching current exchange rates...`,
          progress: 25
        }
      });
    }

    // Fetch the latest exchange rates from the API
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const exchangeRateData = response.data;

    // Check if the API returned data successfully
    if (!exchangeRateData || !exchangeRateData.rates) {
      throw new Error('Failed to fetch exchange rates');
    }

    // Check if the target currency is supported
    if (!exchangeRateData.rates[toCurrency]) {
      throw new Error(`Conversion to ${toCurrency} is not supported`);
    }

    // Get the exchange rate for the target currency
    const rate = exchangeRateData.rates[toCurrency];

    // If you want to publish progress updates
    if (publishToClient) {
      publishToClient({
        type: 'progress',
        data: {
          message: `Converting ${amount} ${fromCurrency} to ${toCurrency}...`,
          progress: 75
        }
      });
    }

    // Calculate the converted amount
    const convertedAmount = amount * rate;

    // Format the result to 2 decimal places
    const formattedAmount = parseFloat(convertedAmount.toFixed(2));

    // Complete the task
    if (publishToClient) {
      publishToClient({
        type: 'progress',
        data: {
          message: `Conversion complete!`,
          progress: 100
        }
      });
    }

    // Return the result as a JSON string
    return JSON.stringify({
      data: {
        amount: formattedAmount,
        fromCurrency,
        toCurrency,
        rate,
        equivalentString: `${amount} ${fromCurrency} = ${formattedAmount} ${toCurrency}`,
        timestamp: new Date().toISOString(),
        lastUpdated: exchangeRateData.time_last_updated
          ? new Date(exchangeRateData.time_last_updated * 1000).toISOString()
          : null,
        provider: exchangeRateData.provider || 'Exchange Rate API'
      }
    });
  } catch (error) {
    console.error('Currency conversion error:', error);

    // Handle errors and return them as a structured JSON response
    return JSON.stringify({
      error: {
        message: error.message || 'Failed to convert currency',
        details: error.response?.data || null
      }
    });
  }
}

/**
 * Currency converter tool definition
 * This follows the ToolDefinition interface from @agentframework/core
 */
const convertCurrencyTool = {
  name: 'convert-currency',
  toolDefinition: {
    type: 'function',
    function: {
      name: 'convert-currency',
      description: 'Convert an amount from one currency to another using current exchange rates',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'The amount of money to convert',
          },
          fromCurrency: {
            type: 'string',
            description: 'The source currency code (e.g., USD, EUR, GBP)',
          },
          toCurrency: {
            type: 'string',
            description: 'The target currency code (e.g., USD, EUR, GBP)',
          },
        },
        required: ['amount', 'fromCurrency', 'toCurrency'],
        additionalProperties: false,
      },
    },
  },
  executor: convertCurrencyExecutor,
};

// Export the tool so it can be loaded by the ToolLoader
module.exports = {
  convertCurrencyTool,
};
