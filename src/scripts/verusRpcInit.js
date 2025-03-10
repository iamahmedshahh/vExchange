// scripts/verusRpcInit.js

const API_URL = 'https://api.verustest.net';

// Utility function for making RPC calls
async function makeRPCCall(method, params = []) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'RPC call failed');
    }

    return data.result;
  } catch (error) {
    console.error(`RPC call failed for method ${method}:`, error);
    throw error;
  }
}

// Class to handle conversion paths and rates
class ConversionManager {
  constructor() {
    this.cachedPaths = new Map();
    this.cachedRates = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  _getCacheKey(fromCurrency, toCurrency) {
    return `${fromCurrency}-${toCurrency}`;
  }

  _isPathCacheValid(cacheEntry) {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < this.cacheTimeout;
  }

  async getCurrencyConverters(fromCurrency, toCurrency) {
    const cacheKey = this._getCacheKey(fromCurrency, toCurrency);
    const cachedResult = this.cachedPaths.get(cacheKey);

    if (this._isPathCacheValid(cachedResult)) {
      return cachedResult.paths;
    }

    try {
      const converters = await makeRPCCall('getcurrencyconverters', [fromCurrency, toCurrency]);
      
      this.cachedPaths.set(cacheKey, {
        paths: converters,
        timestamp: Date.now()
      });

      return converters;
    } catch (error) {
      console.error('Error fetching currency converters:', error);
      throw error;
    }
  }

  async getBestConversionPath(fromCurrency, toCurrency, amount) {
    const converters = await this.getCurrencyConverters(fromCurrency, toCurrency);
    if (!converters || converters.length === 0) {
      throw new Error(`No conversion path found between ${fromCurrency} and ${toCurrency}`);
    }

    let bestPath = null;
    let bestAmount = 0;
    let bestDetails = null;
    let allPaths = [];

    // Try each converter and find the best one
    for (const converter of converters) {
      try {
        const estimate = await this.estimateConversion(fromCurrency, toCurrency, amount, converter);
        
        const pathDetails = {
          converter,
          estimate,
          rate: estimate.estimatedcurrencyout / amount,
          fees: estimate.fees || 0,
          reserves: estimate.reserves || {},
          pathInfo: {
            name: converter.fullyqualifiedname || converter,
            inputReserve: estimate.reserves?.[fromCurrency] || 0,
            outputReserve: estimate.reserves?.[toCurrency] || 0,
            minInput: estimate.mininput || 0,
            maxInput: estimate.maxinput || 0,
            estimatedSlippage: estimate.estimatedslippage || 0
          }
        };

        allPaths.push(pathDetails);

        if (estimate.estimatedcurrencyout > bestAmount) {
          bestAmount = estimate.estimatedcurrencyout;
          bestPath = converter;
          bestDetails = pathDetails;
        }
      } catch (error) {
        console.warn(`Failed to estimate conversion via ${converter}:`, error);
        continue;
      }
    }

    if (!bestPath) {
      throw new Error('Could not find any valid conversion path');
    }

    return {
      best: bestDetails,
      allPaths: allPaths.sort((a, b) => b.estimate.estimatedcurrencyout - a.estimate.estimatedcurrencyout)
    };
  }

  async estimateConversion(fromCurrency, toCurrency, amount, via = null) {
    try {
      const params = {
        currency: fromCurrency,
        convertto: toCurrency,
        amount: parseFloat(amount)
      };

      if (via) {
        params.via = via;
      }

      const estimate = await makeRPCCall('estimateconversion', [params]);
      return estimate;
    } catch (error) {
      console.error('Error estimating conversion:', error);
      throw error;
    }
  }

  async getConversionRate(fromCurrency, toCurrency, amount = 1) {
    try {
      const pathData = await this.getBestConversionPath(fromCurrency, toCurrency, amount);
      const bestPath = pathData.best;
      
      return {
        rate: bestPath.rate,
        estimatedOutput: bestPath.estimate.estimatedcurrencyout,
        fees: bestPath.fees,
        path: [bestPath.converter.fullyqualifiedname || bestPath.converter],
        reserves: bestPath.reserves,
        details: {
          input: {
            currency: fromCurrency,
            amount: amount
          },
          output: {
            currency: toCurrency,
            amount: bestPath.estimate.estimatedcurrencyout
          }
        },
        pathDetails: {
          best: bestPath.pathInfo,
          alternatives: pathData.allPaths
            .filter(p => p !== bestPath)
            .map(p => p.pathInfo)
            .slice(0, 3) // Show top 3 alternatives
        },
        error: null
      };
    } catch (error) {
      return {
        rate: 0,
        estimatedOutput: 0,
        fees: 0,
        path: [],
        reserves: {},
        details: null,
        pathDetails: null,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const conversionManager = new ConversionManager();

// Export only the conversion-related functions
export const getConversionRate = (fromCurrency, toCurrency, amount) => 
  conversionManager.getConversionRate(fromCurrency, toCurrency, amount);

export const getCurrencyPaths = async (fromCurrency, toCurrency) => {
  try {
    const paths = await conversionManager.getCurrencyConverters(fromCurrency, toCurrency);
    return {
      paths: paths || [],
      error: null
    };
  } catch (error) {
    return {
      paths: [],
      error: error.message
    };
  }
};