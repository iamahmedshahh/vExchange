<template>
  <div class="swap-container">
    <h2>Swap Between Bridges</h2>
    
    <!-- Balances Section -->
    <div class="balances-section" v-if="isConnected">
      <div class="balance-item" v-if="sellCoin">
        <span class="balance-label">{{ sellCoin.name }} Balance:</span>
        <span class="balance-amount">{{ formatBalance(sellBalance) }}</span>
      </div>
      <div class="balance-item" v-if="buyCoin">
        <span class="balance-label">{{ buyCoin.name }} Balance:</span>
        <span class="balance-amount">{{ formatBalance(buyBalance) }}</span>
      </div>
    </div>

    <SwapField 
      :selectedCoin="sellCoin" 
      v-model:value="sellAmount"
      :max="sellBalance"
      @openModal="openModal('sell')" 
    />
    
    <div v-if="conversionRate" class="conversion-info">
      <p>1 {{ sellCoin?.name }} = {{ conversionRate.rate }} {{ buyCoin?.name }}</p>
      <p v-if="conversionRate.fees">Fee: {{ (conversionRate.fees * 100).toFixed(2) }}%</p>
    </div>
    
    <SwapField 
      :selectedCoin="buyCoin" 
      :value="buyAmount"
      :max="buyBalance"
      @openModal="openModal('buy')" 
    />

    <!-- Login/Swap Button -->
    <div class="button-container">
      <button v-if="!isConnected" class="connect-button" @click="connect">
        Connect Wallet
      </button>
      <button v-else class="swap-button" @click="initiateSwap" :disabled="!canSwap">
        {{ getSwapButtonText() }}
      </button>
    </div>

    <SwapProgress v-if="isConnected" ref="swapProgressRef" :isLoggedIn="isConnected" />
    
    <CoinModal
      v-if="isModalOpen"
      :loading="modalLoading"
      :coinList="sortedCoinList"
      :errorMessage="errorMessage"
      @selectCoin="selectCoin"
      @closeModal="closeModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import SwapField from './SwapField.vue';
import CoinModal from './CoinModal.vue';
import SwapProgress from './SwapProgress.vue';
import { useUserStore } from '../stores/userStore';
import { useVerusWallet } from '../hooks/useVerusWallet';

const userStore = useUserStore();
const { 
  balances, 
  isConnected, 
  connect,
  getBalance,
  getCurrencies,
  checkExtension,
  network,
  error: walletError 
} = useVerusWallet();

const isLoggedIn = computed(() => userStore.isLoggedIn);
const sellCoin = ref(null);
const buyCoin = ref(null);
const isModalOpen = ref(false);
const modalLoading = ref(false);
const isLoading = ref(false);
const coinList = ref([]);
const selectedField = ref(null);
const swapProgressRef = ref(null);
const conversionRate = ref(null);
const sellAmount = ref('');
const buyAmount = ref('');
const errorMessage = ref('');
const isInitialized = ref(false);

const sortedCoinList = computed(() => {
  console.log('Computing sorted coin list');
  console.log('Current coinList:', coinList.value);
  if (!coinList.value) return [];
  
  // Don't filter by network type, show all available coins
  return [...coinList.value].sort((a, b) => {
    // Get actual balances
    const balanceA = parseFloat(a.balance) || 0;
    const balanceB = parseFloat(b.balance) || 0;
    
    // Sort by balance first (higher balance first)
    if (balanceA !== balanceB) {
      return balanceB - balanceA;
    }
    // Then sort alphabetically
    return a.name.localeCompare(b.name);
  });
});

const sellBalance = computed(() => {
  if (!sellCoin.value) return '0';
  const balance = sellCoin.value.balance || balances.value[sellCoin.value.currencyid] || 0;
  console.log('Computed sell balance:', balance);
  return formatBalance(balance);
});

const buyBalance = computed(() => {
  if (!buyCoin.value) return '0';
  const balance = buyCoin.value.balance || balances.value[buyCoin.value.currencyid] || 0;
  console.log('Computed buy balance:', balance);
  return formatBalance(balance);
});

function formatBalance(balance) {
  if (!balance) return '0.00';
  return parseFloat(balance).toFixed(8);
}

// Computed property to check if swap is possible
const canSwap = computed(() => {
  return isConnected.value && 
         sellCoin.value && 
         buyCoin.value && 
         parseFloat(sellAmount.value) > 0 && 
         parseFloat(sellAmount.value) <= parseFloat(sellBalance.value);
});

// Get appropriate button text based on state
function getSwapButtonText() {
  if (!sellCoin.value || !buyCoin.value) return 'Select tokens';
  if (!sellAmount.value) return 'Enter amount';
  if (parseFloat(sellAmount.value) > parseFloat(sellBalance.value)) return 'Insufficient balance';
  return 'Swap';
}

// Watch for changes in selected coins to update conversion rate
watch([sellCoin, buyCoin], async ([newSell, newBuy]) => {
  if (newSell && newBuy) {
    try {
      const rates = await window.verus.getConversionRate(newSell.name, newBuy.name);
      if (rates && Object.keys(rates).length > 0) {
        // Use the first available converter's rate
        conversionRate.value = rates[Object.keys(rates)[0]];
      } else {
        conversionRate.value = null;
      }
    } catch (error) {
      console.error('Error getting conversion rate:', error);
      conversionRate.value = null;
    }
  } else {
    conversionRate.value = null;
  }
});

// Watch for changes in sell amount and conversion rate to update buy amount
watch([sellAmount, conversionRate], ([newSellAmount, newRate]) => {
  if (newSellAmount && newRate) {
    const numericAmount = parseFloat(newSellAmount);
    if (!isNaN(numericAmount)) {
      buyAmount.value = (numericAmount * newRate.rate).toFixed(8);
    } else {
      buyAmount.value = '';
    }
  } else {
    buyAmount.value = '';
  }
});

// Watch for connection state changes
watch(isConnected, async (newValue, oldValue) => {
  if (!newValue) {
    console.log('Wallet disconnected, resetting state...');
    sellCoin.value = null;
    buyCoin.value = null;
    coinList.value = [];
    return;
  }
  
  if (newValue && !oldValue) {
    try {
      await fetchCoins().catch(error => {
        console.error('[Swap] Error fetching coins after connection:', error);
        // Don't throw here, just log the error
      });
    } catch (error) {
      console.error('[Swap] Error in connection watcher:', error);
    }
  }
});

// Watch for network changes
watch(() => network.value?.isTestnet, async (newIsTestnet) => {
  console.log('Network changed, refetching coins...');
  await fetchCoins();
  
  // Reset selected coins if they're not valid for the new network
  if (sellCoin.value) {
    const isTestCoin = sellCoin.value.currencyid.includes('TEST');
    if (newIsTestnet !== isTestCoin) {
      sellCoin.value = null;
    }
  }
  if (buyCoin.value) {
    const isTestCoin = buyCoin.value.currencyid.includes('TEST');
    if (newIsTestnet !== isTestCoin) {
      buyCoin.value = null;
    }
  }
});

// Initialize on component mount
onMounted(async () => {
  console.log('Swap component mounted');
  // Check if already connected
  if (isConnected.value) {
    console.log('Wallet already connected, fetching coins...');
    await fetchCoins();
  }
});

async function openModal(field) {
  console.log('[Swap] Opening modal for field:', field);
  
  selectedField.value = field;
  isModalOpen.value = true;
  modalLoading.value = true;
  errorMessage.value = '';
  
  try {
    // Check wallet connection
    if (!isConnected.value) {
      console.log('[Swap] Wallet not connected, attempting to connect...');
      await connect();
      
      if (!isConnected.value) {
        throw new Error('Please connect your wallet first');
      }
    }
    
    console.log('[Swap] Wallet connected, fetching coins...');
    await fetchCoins();
  } catch (error) {
    console.error('[Swap] Modal open error:', error);
    errorMessage.value = error.message;
  } finally {
    modalLoading.value = false;
  }
}

async function fetchCoins() {
  try {
    const currencies = await getCurrencies();
    console.log('[Swap] Got currencies:', currencies);
    
    if (!currencies || !Array.isArray(currencies) || currencies.length === 0) {
      throw new Error('No currencies available');
    }

    // Map currencies to coins with logos
    const processedCoins = currencies.map(currency => ({
      name: currency.name || currency.currencyid,
      currencyid: currency.currencyid,
      balance: currency.balance || '0',
      logo: `/src/assets/${currency.currencyid.toLowerCase()}_logo.png`
    }));
    
    console.log('[Swap] Processed coins:', processedCoins);
    coinList.value = processedCoins;

    // Auto-select first coin with balance if none selected
    if (!sellCoin.value && processedCoins.length > 0) {
      const coinWithBalance = processedCoins.find(coin => parseFloat(coin.balance) > 0);
      if (coinWithBalance) {
        console.log('[Swap] Auto-selecting first coin with balance:', coinWithBalance);
        sellCoin.value = coinWithBalance;
      }
    }

    return processedCoins;
  } catch (error) {
    console.error('[Swap] Error in fetchCoins:', error);
    throw error;
  }
}

function selectCoin(coin) {
  console.log('Selected coin:', coin);
  console.log('Selected coin balance:', coin.balance);
  
  const coinWithBalance = {
    ...coin,
    balance: coin.balance || balances.value[coin.currencyid] || 0
  };
  
  if (selectedField.value === 'sell') {
    console.log('Setting sell coin with balance:', coinWithBalance);
    sellCoin.value = coinWithBalance;
    // Update sell amount max based on balance
    if (coinWithBalance.balance > 0) {
      console.log('Setting max sell amount to:', coinWithBalance.balance);
    }
  } else {
    console.log('Setting buy coin with balance:', coinWithBalance);
    buyCoin.value = coinWithBalance;
  }
  
  closeModal();
}

function closeModal() {
  isModalOpen.value = false;
}

const checkBalance = async () => {
  const iaddress = localStorage.getItem('iaddress');
  if (!iaddress) {
    console.error('No iaddress found');
    return false;
  }

  try {
    const balanceCheck = await window.verus.checkCurrencyBalance(iaddress, sellCoin.value.name);
    console.log('Balance check result:', balanceCheck);

    if (!balanceCheck.available || balanceCheck.balance < parseFloat(sellAmount.value)) {
      errorMessage.value = `Insufficient ${sellCoin.value.name} balance. Available: ${balanceCheck.balance}`;
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error checking balance:', err);
    errorMessage.value = 'Error checking balance';
    return false;
  }
};

async function initiateSwap() {
  if (!isLoggedIn.value || !sellCoin.value || !buyCoin.value || !sellAmount.value) {
    return;
  }

  try {
    const iaddress = localStorage.getItem('iaddress');
    console.log('Initiating swap for iAddress:', iaddress);
    
    if (!iaddress) {
      errorMessage.value = 'Please log in again to verify your address';
      return;
    }

    errorMessage.value = '';
    swapProgressRef.value?.updateProgress(1, 'Checking balance...');

    if (!await checkBalance()) {
      swapProgressRef.value?.setError(errorMessage.value);
      return;
    }

    swapProgressRef.value?.updateProgress(1, 'Initiating swap...');
    
    // Call sendCrossChain function with proper parameters
    const result = await window.verus.sendCrossChain({
      fromCurrency: sellCoin.value.name,
      toCurrency: buyCoin.value.name,
      amount: sellAmount.value
    });

    console.log('Swap result:', result);

    if (result.success) {
      swapProgressRef.value?.updateProgress(2, 'Processing swap...');
      // Monitor the transaction
      setTimeout(() => {
        swapProgressRef.value?.updateProgress(3, `Swap completed! Transaction ID: ${result.data}`);
      }, 3000);
    } else {
      const errorMsg = result.error.includes('No UTXOs found') 
        ? `Insufficient ${sellCoin.value.name} balance` 
        : result.error;
      errorMessage.value = errorMsg;
      swapProgressRef.value?.setError(errorMsg);
    }
  } catch (error) {
    console.error('Swap error:', error);
    errorMessage.value = error.message;
    swapProgressRef.value?.setError('Failed to initiate swap: ' + error.message);
  }
}
</script>

<style scoped>
.swap-container {
  max-width: 480px;
  margin: 0 auto;
  padding: 20px;
}

.balances-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.balance-item:not(:last-child) {
  border-bottom: 1px solid #eee;
}

.balance-label {
  color: #666;
  font-size: 0.9em;
}

.balance-amount {
  font-weight: 500;
  color: #333;
}

.button-container {
  margin-top: 20px;
}

.connect-button, .swap-button {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 1.1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.connect-button {
  background: #2196f3;
  color: white;
}

.connect-button:hover {
  background: #1976d2;
}

.swap-button {
  background: #4caf50;
  color: white;
}

.swap-button:hover:not(:disabled) {
  background: #43a047;
}

.swap-button:disabled {
  background: #e0e0e0;
  color: #999;
  cursor: not-allowed;
}

.conversion-info {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin: 12px 0;
  font-size: 0.9em;
  color: #666;
  text-align: center;
}
</style>
