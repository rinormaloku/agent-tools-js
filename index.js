/**
 * Currency Conversion Tool
 * This example tool converts amounts between different currencies using real exchange rates
 */

// Import the tool from the implementation file
const { convertCurrencyTool } = require('./convertCurrency');
const { weatherForecastTool } = require('./weatherForecast');

// Re-export the tool so it can be loaded by the ToolLoader
module.exports = {
  convertCurrencyTool,
  weatherForecastTool,
};