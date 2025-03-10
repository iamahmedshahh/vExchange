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
      <p class="rate">1 {{ sellCoin?.name }} = {{ formatNumber(conversionRate.rate) }} {{ buyCoin?.name }}</p>
      
      <!-- Path Details -->
      <div v-if="conversionRate.pathDetails?.best" class="path-details">
        <div class="best-path">
          <p class="path-header">Best Route:</p>
          <div class="path-info">
            <p class="path-name">
              Via: <span class="path-highlight">{{ formatConversionPath([conversionRate.pathDetails.best.name]) }}</span>
            </p>
            <div class="path-stats">
              <div class="stat-item">
                <span class="stat-label">Input Reserve:</span>
                <span class="stat-value">{{ formatNumber(conversionRate.pathDetails.best.inputReserve) }} {{ sellCoin?.name }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Output Reserve:</span>
                <span class="stat-value">{{ formatNumber(conversionRate.pathDetails.best.outputReserve) }} {{ buyCoin?.name }}</span>
              </div>
              <div class="stat-item" v-if="conversionRate.pathDetails.best.estimatedSlippage">
                <span class="stat-label">Est. Slippage:</span>
                <span class="stat-value">{{ formatNumber(conversionRate.pathDetails.best.estimatedSlippage * 100) }}%</span>
              </div>
              <div class="stat-item limits">
                <span class="stat-label">Limits:</span>
                <span class="stat-value">
                  Min: {{ formatNumber(conversionRate.pathDetails.best.minInput) }} {{ sellCoin?.name }}
                  <br>
                  Max: {{ formatNumber(conversionRate.pathDetails.best.maxInput) }} {{ sellCoin?.name }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Alternative Paths -->
        <div v-if="conversionRate.pathDetails.alternatives?.length" class="alternative-paths">
          <p class="path-header">Alternative Routes:</p>
          <div v-for="(path, index) in conversionRate.pathDetails.alternatives" :key="index" class="alt-path">
            <p class="path-name">{{ formatConversionPath([path.name]) }}</p>
            <div class="alt-path-stats">
              <span class="stat-item">
                <span class="stat-label">Input Reserve:</span>
                {{ formatNumber(path.inputReserve) }}
              </span>
              <span class="stat-item">
                <span class="stat-label">Output Reserve:</span>
                {{ formatNumber(path.outputReserve) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p v-if="conversionRate.fees" class="fees">
        Fee: {{ formatNumber(conversionRate.fees * 100) }}%
        <span v-if="conversionRate.details" class="fee-details">
          ({{ formatNumber(conversionRate.details.input.amount) }} {{ conversionRate.details.input.currency }} →
          {{ formatNumber(conversionRate.details.output.amount) }} {{ conversionRate.details.output.currency }})
        </span>
      </p>
      
      <p v-if="conversionRate.error" class="error">
        {{ conversionRate.error }}
      </p>
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
import { getConversionRate } from '../scripts/verusRpcInit';

const userStore = useUserStore();
const { 
  balances, 
  isConnected, 
  connect,
  getBalance,
  getCurrencies,
  checkExtension,
  network,
  preconvertCurrency,
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
  const id = sellCoin.value.currencyid || sellCoin.value.name;
  return balances.value[id] || '0';
});

const buyBalance = computed(() => {
  if (!buyCoin.value) return '0';
  const id = buyCoin.value.currencyid || buyCoin.value.name;
  return balances.value[id] || '0';
});

function formatBalance(balance) {
  if (!balance) return '0';
  const num = parseFloat(balance);
  if (num === 0) return '0';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  });
}

function formatNumber(num) {
  if (!num) return '0';
  return Number(num).toFixed(8).replace(/\.?0+$/, '');
};

function formatConversionPath(path) {
  if (!path || !Array.isArray(path)) return '';
  return path.map(p => typeof p === 'string' ? p : (p.fullyqualifiedname || 'Unknown')).join(' → ');
};

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
watch([sellCoin, buyCoin, sellAmount], async ([newSell, newBuy, newAmount], [oldSell, oldBuy, oldAmount]) => {
  if (newSell && newBuy) {
    try {
      isLoading.value = true;
      const amount = parseFloat(newAmount) || 1;
      
      const rate = await getConversionRate(
        newSell.currencyid,
        newBuy.currencyid,
        amount
      );
      
      conversionRate.value = rate;
      
      // Update buy amount based on sell amount and rate
      if (newAmount && !isNaN(amount) && rate.rate > 0) {
        buyAmount.value = (amount * rate.rate).toFixed(8);
      }
    } catch (error) {
      console.error('Error getting conversion rate:', error);
      conversionRate.value = {
        rate: 0,
        fees: 0,
        error: error.message
      };
    } finally {
      isLoading.value = false;
    }
  } else {
    conversionRate.value = null;
    buyAmount.value = '';
  }
}, { immediate: true });

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
  
  // Reset states first
  selectedField.value = field;
  isModalOpen.value = true;
  modalLoading.value = true;
  errorMessage.value = '';
  coinList.value = []; // Clear previous coin list
  
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

function closeModal() {
  isModalOpen.value = false;
  modalLoading.value = false;
  errorMessage.value = '';
  selectedField.value = null;
}

async function fetchCoins() {
  try {
    console.log('[Swap] Computing sorted coin list');
    console.log('[Swap] Current coinList:', coinList.value);

    // Get currencies from wallet
    const currencies = await getCurrencies();
    console.log('[Swap] Got currencies:', currencies);

    if (!currencies || !Array.isArray(currencies) || currencies.length === 0) {
      throw new Error('No currencies available');
    }

    // Map currencies to coins with logos
    const processedCoins = currencies
      .filter(currency => {
        const currencyId = currency.currencyid || currency.name;
        if (!currencyId) {
          console.warn('[Swap] Skipping currency missing ID:', currency);
          return false;
        }
        return true;
      })
      .map(currency => {
        const currencyId = currency.currencyid || currency.name;
        return {
          name: currency.name || currencyId,
          currencyid: currencyId,
          balance: currency.balance || '0',
          logo: `/src/assets/${currencyId.toLowerCase()}_logo.png`,
          istoken: currency.istoken || false,
          issystemcurrency: currency.issystemcurrency || false,
          isconvertible: currency.isconvertible || false
        };
      });

    if (processedCoins.length === 0) {
      throw new Error('No valid currencies found');
    }

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
  } catch (error) {
    console.error('[Swap] Error in fetchCoins:', error);
    throw error;
  }
}

function selectCoin(coin) {
  console.log('[Swap] Selected coin:', coin);
  
  // Get the balance using currencyid or name
  const id = coin.currencyid || coin.name;
  const balance = balances.value[id] || '0';
  console.log('[Swap] Selected coin balance:', balance);
  
  if (selectedField.value === 'sell') {
    console.log('[Swap] Setting sell coin:', coin);
    sellCoin.value = {
      ...coin,
      balance
    };
  } else {
    console.log('[Swap] Setting buy coin:', coin);
    buyCoin.value = {
      ...coin,
      balance
    };
  }
  
  closeModal();
}

const checkBalance = async () => {
  if (!sellCoin.value) return false;

  try {
    // Use the current balance from the balances state
    const id = sellCoin.value.currencyid || sellCoin.value.name;
    const currentBalance = parseFloat(balances.value[id] || '0');
    const requiredAmount = parseFloat(sellAmount.value);

    console.log('[Swap] Checking balance:', { currentBalance, requiredAmount });

    if (currentBalance < requiredAmount) {
      errorMessage.value = `Insufficient ${sellCoin.value.name} balance. Available: ${formatBalance(currentBalance)}`;
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
  if (!canSwap.value) return;

  try {
    isLoading.value = true;
    errorMessage.value = '';

    // Update progress
    if (swapProgressRef.value) {
      swapProgressRef.value.startSwap();
    }

    // Execute the swap
    const result = await preconvertCurrency({
      fromCurrency: sellCoin.value.currencyid,
      toCurrency: buyCoin.value.currencyid,
      amount: parseFloat(sellAmount.value),
      via: conversionRate.value?.path?.[0] || 'SPORTS'
    });

    // Update progress on success
    if (swapProgressRef.value) {
      swapProgressRef.value.completeSwap(result.txid);
    }

    // Reset form
    sellAmount.value = '';
    buyAmount.value = '';

    // Refresh balances
    await Promise.all([
      getBalance(sellCoin.value.currencyid),
      getBalance(buyCoin.value.currencyid)
    ]);

  } catch (error) {
    console.error('Swap error:', error);
    errorMessage.value = error.message || 'Failed to execute swap';
    
    // Update progress on error
    if (swapProgressRef.value) {
      swapProgressRef.value.failSwap(error.message);
    }
  } finally {
    isLoading.value = false;
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
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
}

.conversion-info p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.conversion-info .rate {
  font-size: 1rem;
  font-weight: 500;
}

.conversion-info .fees {
  color: #888;
}

.conversion-info .path {
  color: #666;
  font-size: 0.8rem;
}

.conversion-info .error {
  color: #ff4444;
  font-size: 0.8rem;
}

.path-details {
  margin: 12px 0;
  background: rgba(44, 62, 80, 0.05);
  border-radius: 8px;
  padding: 12px;
}

.path-header {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 0.9em;
}

.path-info {
  padding-left: 8px;
  border-left: 3px solid #3498db;
}

.path-name {
  margin: 4px 0;
  color: #2c3e50;
}

.path-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.stat-item {
  font-size: 0.85em;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.5);
  padding: 6px;
  border-radius: 4px;
}

.stat-label {
  color: #7f8c8d;
  margin-bottom: 2px;
}

.stat-value {
  color: #2c3e50;
  font-weight: 500;
}

.limits {
  grid-column: 1 / -1;
}

.alternative-paths {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #bdc3c7;
}

.alt-path {
  padding: 8px;
  margin: 4px 0;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  font-size: 0.85em;
}

.alt-path-stats {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.path-highlight {
  color: #2c3e50;
  font-weight: 500;
  background: rgba(52, 152, 219, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
