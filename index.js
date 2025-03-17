/**
 * Currency Conversion Tool
 * This example tool converts amounts between different currencies
 */

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
    // Mock exchange rates (in a real tool, you would call an API)
    const exchangeRates = {
      USD: {
        EUR: 0.93,
        GBP: 0.79,
        JPY: 151.72,
        CAD: 1.38,
        AUD: 1.52,
        CHF: 0.89,
        CNY: 7.21,
        INR: 83.45,
      },
      EUR: {
        USD: 1.08,
        GBP: 0.85,
        JPY: 163.85,
        CAD: 1.49,
        AUD: 1.64,
        CHF: 0.96,
        CNY: 7.79,
        INR: 90.13,
      },
      GBP: {
        USD: 1.27,
        EUR: 1.17,
        JPY: 191.90,
        CAD: 1.74,
        AUD: 1.92,
        CHF: 1.13,
        CNY: 9.12,
        INR: 105.48,
      }
      // Additional rates would be included in a complete implementation
    };

    if (!exchangeRates[fromCurrency]) {
      throw new Error(`Unsupported currency: ${fromCurrency}`);
    }

    if (!exchangeRates[fromCurrency][toCurrency]) {
      throw new Error(`Conversion from ${fromCurrency} to ${toCurrency} is not supported`);
    }

    const rate = exchangeRates[fromCurrency][toCurrency];
    const convertedAmount = amount * rate;

    // Format the result to 2 decimal places
    const formattedAmount = parseFloat(convertedAmount.toFixed(2));

    // If you want to publish progress or updates to the client
    if (publishToClient) {
      publishToClient({
        type: 'progress',
        data: { 
          message: `Converting ${amount} ${fromCurrency} to ${toCurrency}...`,
          progress: 50
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
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    // Handle errors and return them as a structured JSON response
    return JSON.stringify({
      error: {
        message: error.message || 'Failed to convert currency',
      }
    });
  }
}

/**
 * Currency converter tool definition
 * This follows the ToolDefinition interface from @agentframework/core
 */
const convertCurrencyTool = {
  name: 'convertCurrency',
  toolDefinition: {
    type: 'function',
    function: {
      name: 'convertCurrency',
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
            enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'],
          },
          toCurrency: {
            type: 'string',
            description: 'The target currency code (e.g., USD, EUR, GBP)',
            enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'],
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