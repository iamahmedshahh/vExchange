// scripts/verusRpcInit.js

import { VerusdRpcInterface } from 'verusd-rpc-ts-client';

// Initialize the RPC client with proper configuration
const verusdClient = new VerusdRpcInterface("VRSCTEST", "https://api.verustest.net");

// Add this function to check balance for specific currency
export async function checkCurrencyBalance(address, targetCurrency) {
  try {
    console.log(`Checking balance for ${targetCurrency} at address ${address}`);
    
    // Get UTXOs for the address
    const utxoResponse = await verusdClient.getAddressUtxos({
      addresses: [address],
      currencynames: true
    });
    console.log('Raw UTXO response for ' + targetCurrency + ':', utxoResponse);

    if (!utxoResponse.result) {
      console.log('No UTXOs found');
      return {
        available: false,
        balance: 0,
        utxos: [],
        address
      };
    }

    const allUtxos = utxoResponse.result;
    console.log('All available UTXOs:', allUtxos);

    // Filter UTXOs that have the target currency
    const relevantUtxos = allUtxos.filter(utxo => {
      // Check both currencynames and currencyvalues
      const hasCurrencyInNames = utxo.currencynames && utxo.currencynames[targetCurrency];
      const hasCurrencyInValues = utxo.currencyvalues && utxo.currencyvalues[targetCurrency];
      
      // For VRSC/VRSCTEST, also check satoshis
      const isNativeCurrency = targetCurrency === 'VRSC' || targetCurrency === 'VRSCTEST';
      const hasNativeBalance = isNativeCurrency && utxo.satoshis > 0;

      return hasCurrencyInNames || hasCurrencyInValues || hasNativeBalance;
    });

    // Calculate total balance
    let totalBalance = 0;

    relevantUtxos.forEach(utxo => {
      if (targetCurrency === 'VRSC' || targetCurrency === 'VRSCTEST') {
        totalBalance += (utxo.satoshis || 0) / 100000000; // Convert satoshis to VRSC
      } else {
        // Check both currencynames and currencyvalues
        const amountFromNames = utxo.currencynames?.[targetCurrency] || 0;
        const amountFromValues = utxo.currencyvalues?.[targetCurrency] || 0;
        totalBalance += parseFloat(amountFromNames || amountFromValues);
      }
    });

    console.log(`Total ${targetCurrency} balance for address ${address}:`, totalBalance);

    return {
      available: totalBalance > 0,
      balance: totalBalance,
      utxos: relevantUtxos,
      address
    };
  } catch (error) {
    console.error('Error checking currency balance:', error);
    throw error;
  }
}

// Get available conversion paths between currencies
export async function getCurrencyPaths(fromCurrency, toCurrency) {
  try {
    console.log(`Getting conversion paths from ${fromCurrency} to ${toCurrency}`);
    
    const response = await verusdClient.getcurrencyconverters([fromCurrency, toCurrency]);
    console.log("Currency paths response:", response);

    if (!response || !response.result) {
      throw new Error('Failed to get currency converters');
    }

    return {
      paths: response.result || [],
      error: null
    };

  } catch (error) {
    console.error('Error getting currency paths:', error);
    return {
      paths: [],
      error: error.message
    };
  }
}

export async function getConversionRate(fromCurrency, toCurrency, amount = 1) {
  try {
    console.log(`Getting conversion rate from ${fromCurrency} to ${toCurrency} for amount ${amount}`);
    
    // Try direct conversion first
    const estimateResult = await verusdClient.estimateConversion({
      amount: amount,
      currency: fromCurrency,
      convertto: toCurrency
    });

    console.log("Estimate result:", estimateResult);

    if (estimateResult && estimateResult.result) {
      const result = estimateResult.result;
      const rate = result.estimatedcurrencyout / amount;
      
      return {
        rate: rate,
        estimatedOutput: result.estimatedcurrencyout,
        fees: result.fees || 0,
        path: result.conversionpath || [],
        reserves: result.reserves || {},
        error: null
      };
    }

    // If direct conversion fails, try to get available paths
    const pathsResult = await getCurrencyPaths(fromCurrency, toCurrency);
    if (pathsResult.paths && pathsResult.paths.length > 0) {
      // Try conversion with the first available path
      const pathEstimate = await verusdClient.estimateConversion({
        amount: amount,
        currency: fromCurrency,
        convertto: toCurrency,
        via: pathsResult.paths[0]
      });

      if (pathEstimate && pathEstimate.result) {
        const result = pathEstimate.result;
        const rate = result.estimatedcurrencyout / amount;
        
        return {
          rate: rate,
          estimatedOutput: result.estimatedcurrencyout,
          fees: result.fees || 0,
          path: pathsResult.paths[0],
          reserves: result.reserves || {},
          error: null,
          availablePaths: pathsResult.paths
        };
      }
    }

    throw new Error(`No conversion path found between ${fromCurrency} and ${toCurrency}`);
  } catch (error) {
    console.error('Error getting conversion rate:', error);
    return {
      rate: 0,
      estimatedOutput: 0,
      fees: 0,
      path: [],
      reserves: {},
      error: error.message
    };
  }
}

export async function getConverters() {
  try {
    // First get the currency list
    const currencies = await listCurrencies();
    if (!currencies) {
      throw new Error('Failed to get currencies');
    }

    // Create a map of currency converters
    const converters = {};
    for (const currency of currencies) {
      if (currency.currencydefinition) {
        const def = currency.currencydefinition;
        if (def.options && (def.options.gateway || def.options.bridge)) {
          converters[def.name] = {
            currencies: [def.name],
            conversionrate: 1,
            fees: 0,
            reserves: {}
          };
        }
      }
    }

    return converters;
  } catch (error) {
    console.error("Error getting converters:", error);
    throw error;
  }
}

export async function getBal(thisaddress) {
  try {
    if (!thisaddress) {
      throw new Error("Address is required");
    }
    console.log("Getting balance for address:", thisaddress);
    
    const balanceRes = await verusdClient.getAddressBalance({ addresses: [thisaddress] });
    console.log("Balance response:", balanceRes);

    if (!balanceRes || typeof balanceRes.result === 'undefined') {
      throw new Error("Failed to get address balance");
    }

    return balanceRes;
  } catch (error) {
    console.error("Error fetching balance:", error.message);
    throw error;
  }
}

export async function sendCrossChain({ fromCurrency, toCurrency, amount }) {
  try {
    console.log('Initiating cross-chain transaction:', { fromCurrency, toCurrency, amount });
    
    const iaddress = localStorage.getItem('iaddress');
    if (!iaddress) {
      throw new Error('No address found. Please log in.');
    }

    // Get conversion rate
    const conversionDetails = await getConversionRate(fromCurrency, toCurrency, amount);
    console.log('Conversion details:', conversionDetails);

    if (!conversionDetails || typeof conversionDetails.rate !== 'number') {
      throw new Error('Could not determine conversion rate');
    }

    const expectedOutput = conversionDetails.estimatedOutput;
    console.log('Expected output:', expectedOutput);

    // Get UTXOs for the address
    const utxos = await verusdClient.getAddressUtxos({
      addresses: [iaddress],
      currencynames: true
    });
    
    // Add detailed UTXO logging
    if (utxos.result) {
      console.log('Number of UTXOs found:', utxos.result.length);
      utxos.result.forEach((utxo, index) => {
        console.log(`UTXO ${index + 1}:`, {
          currencynames: utxo.currencynames,
          currencyvalues: utxo.currencyvalues,
          satoshis: utxo.satoshis,
          amount: utxo.amount,
          txid: utxo.txid,
          outputIndex: utxo.outputIndex
        });
      });
    }

    if (utxos.error || !utxos.result || utxos.result.length === 0) {
      throw new Error('No available UTXOs found');
    }

    // Find UTXOs with the source currency
    const sourceUtxos = utxos.result.filter(utxo => {
      console.log('Checking UTXO for currency:', fromCurrency, {
        currencynames: utxo.currencynames,
        currencyvalues: utxo.currencyvalues,
        satoshis: utxo.satoshis
      });

      // Check for native currency (VRSC/VRSCTEST)
      if ((fromCurrency === 'VRSC' || fromCurrency === 'VRSCTEST') && utxo.satoshis > 0) {
        return true;
      }

      // Check both currencynames and currencyvalues
      return (utxo.currencynames && utxo.currencynames[fromCurrency]) ||
             (utxo.currencyvalues && utxo.currencyvalues[fromCurrency]);
    });

    console.log('Source UTXOs found:', sourceUtxos);

    if (sourceUtxos.length === 0) {
      throw new Error(`No UTXOs found for currency ${fromCurrency}`);
    }

    // Calculate total available amount
    let totalAvailable = 0;
    sourceUtxos.forEach(utxo => {
      if (fromCurrency === 'VRSC' || fromCurrency === 'VRSCTEST') {
        totalAvailable += (utxo.satoshis || 0) / 100000000;
      } else {
        const amountFromNames = utxo.currencynames?.[fromCurrency] || 0;
        const amountFromValues = utxo.currencyvalues?.[fromCurrency] || 0;
        totalAvailable += parseFloat(amountFromNames || amountFromValues);
      }
    });

    console.log(`Total available ${fromCurrency}:`, totalAvailable);
    
    if (totalAvailable < parseFloat(amount)) {
      throw new Error(`Insufficient balance. Available: ${totalAvailable} ${fromCurrency}`);
    }

    // Create raw transaction inputs
    const inputs = sourceUtxos.map(utxo => ({
      txid: utxo.txid,
      vout: utxo.outputIndex
    }));

    // Create transaction outputs with conversion
    const outputs = [{
      addresses: [iaddress],
      amount: parseFloat(amount),
      currency: fromCurrency,
      convert: {
        currency: toCurrency,
        estimate: expectedOutput
      }
    }];

    // Create the raw transaction
    const rawTxParams = {
      inputs,
      outputs
    };

    console.log('Creating raw transaction with params:', rawTxParams);
    const createResult = await verusdClient.getRawTransaction(rawTxParams);

    if (createResult.error) {
      throw new Error(createResult.error.message || 'Failed to create transaction');
    }

    // Fund the transaction
    const fundResult = await verusdClient.fundRawTransaction({
      hexstring: createResult.result,
      options: {
        changeAddress: iaddress
      }
    });

    if (fundResult.error) {
      throw new Error(fundResult.error.message || 'Failed to fund transaction');
    }

    // Send the funded transaction
    console.log('Sending raw transaction:', fundResult.result.hex);
    const sendResult = await verusdClient.sendRawTransaction(fundResult.result.hex);

    if (sendResult.error) {
      throw new Error(sendResult.error.message || 'Failed to send transaction');
    }

    return {
      success: true,
      data: sendResult.result,
      txid: typeof sendResult.result === 'string' ? sendResult.result : sendResult.result.txid,
      expectedOutput: expectedOutput,
      rate: conversionDetails.rate
    };
  } catch (error) {
    console.error("Transaction error:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getAllCurrencyBalances(address) {
  try {
    console.log('Getting balances for address:', address);
    
    if (!address) {
      throw new Error('Address is required');
    }

    // Get all currencies first
    const currencies = await listCurrencies();
    console.log('Fetched currencies:', currencies);
    
    if (!currencies) {
      throw new Error('Failed to fetch currencies');
    }

    // Get direct balance first (this includes VRSC balance)
    const balanceRes = await verusdClient.getAddressBalance({ 
      addresses: [address],
      currencynames: true
    });
    console.log('Direct balance response:', balanceRes);

    // Initialize balance map with VRSC balance if available
    const balanceMap = {};
    if (balanceRes.result && typeof balanceRes.result.balance !== 'undefined') {
      balanceMap['VRSC'] = balanceRes.result.balance / 100000000; // Convert from satoshis to VRSC
    }

    // Add currency balances if available
    if (balanceRes.result && balanceRes.result.currencybalance) {
      Object.entries(balanceRes.result.currencybalance).forEach(([currency, amount]) => {
        balanceMap[currency] = amount / 100000000; // Convert from satoshis
      });
    }

    console.log('Balance map from getAddressBalance:', balanceMap);

    // Map currencies with their balances
    const result = currencies.map(item => {
      const currencyName = item.currencydefinition.name;
      const balance = balanceMap[currencyName] || 0;
      console.log(`Mapping currency ${currencyName} with balance:`, balance);
      
      return {
        currencyid: item.currencydefinition.currencyid,
        name: currencyName,
        balance: balance,
        currencytype: 'Currency',
        supply: item.bestcurrencystate?.supply || 0,
        privatesupply: item.bestcurrencystate?.privatesupply || 0,
        reserve: item.bestcurrencystate?.reservein || 0,
        parent: item.currencydefinition.parent,
        systemid: item.currencydefinition.systemid,
        options: item.currencydefinition.options
      };
    });

    // Add VRSC if it's not already in the list
    if (balanceMap['VRSC'] && !result.find(c => c.name === 'VRSC')) {
      result.push({
        currencyid: 'VRSC',
        name: 'VRSC',
        balance: balanceMap['VRSC'],
        currencytype: 'Currency',
        supply: 0,
        privatesupply: 0,
        reserve: 0,
        parent: null,
        systemid: null,
        options: {}
      });
    }

    console.log('Final result with balances:', result);
    return result;
  } catch (error) {
    console.error('Error getting all currency balances:', error);
    throw error;
  }
}

export async function listCurrencies() {
  try {
    console.log("Calling listCurrencies...");
    const res = await verusdClient.listCurrencies();
    
    if (!res || !res.result) {
      console.error("Invalid response from listCurrencies:", res);
      return [];
    }

    // Log the full response structure
    console.log("Full listCurrencies response:", JSON.stringify(res, null, 2));
    
    // Log a sample currency to understand its structure
    if (res.result && res.result.length > 0) {
      console.log("Sample currency structure:", JSON.stringify(res.result[0], null, 2));
    }

    // Process and return only valid currencies
    const validCurrencies = res.result.filter(currency => 
      currency && 
      currency.currencydefinition && 
      currency.currencydefinition.currencyid
    );

    console.log(`Found ${validCurrencies.length} valid currencies`);
    return validCurrencies;
  } catch (error) {
    console.error("listCurrencies error:", error);
    throw error;
  }
}