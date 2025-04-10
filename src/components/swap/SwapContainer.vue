<template>
  <div class="swap-container">
    <Card variant="elevated" hover>
      <div class="swap-header">
        <h2>Swap</h2>
        <div class="swap-actions">
          <button class="action-button refresh-button" @click="refreshData">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"></path>
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div class="swap-body">
        <SwapInput
          v-model="fromAmount"
          :selected-token="fromToken"
          label="From"
          :max="fromBalance"
          :show-max-button="!!fromToken"
          :show-balance-info="!!fromToken"
          @open-token-select="openTokenSelect('from')"
          @max="handleMaxAmount"
        />
        
        <div class="swap-direction">
          <button class="swap-direction-button" @click="swapTokens">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="7 10 12 15 17 10"></polyline>
              <polyline points="7 14 12 9 17 14"></polyline>
            </svg>
          </button>
        </div>
        
        <SwapInput
          v-model="toAmount"
          :selected-token="toToken"
          label="To (estimated)"
          :disabled="true"
          :show-balance-info="!!toToken"
          :max="toBalance"
          @open-token-select="openTokenSelect('to')"
        />

        <div v-if="conversionRate" class="conversion-details">
          <div class="rate-info">
            <span>Rate</span>
            <span>1 {{ fromToken?.name || '?' }} = {{ formatNumber(conversionRate.rate) }} {{ toToken?.name || '?' }}</span>
          </div>
          
          <div class="route-info">
            <span>Route</span>
            <span>{{ formatConversionPath(conversionRate.path) }}</span>
          </div>
          
          <div v-if="conversionRate.fees" class="fee-info">
            <span>Fee</span>
            <span>{{ formatNumber(conversionRate.fees * 100) }}%</span>
          </div>
          
          <div v-if="conversionRate.pathDetails?.best?.estimatedSlippage" class="slippage-info">
            <span>Est. Slippage</span>
            <span>{{ formatNumber(conversionRate.pathDetails.best.estimatedSlippage * 100) }}%</span>
          </div>
        </div>
        
        <div v-if="conversionRate?.error" class="conversion-error">
          {{ conversionRate.error }}
        </div>

        <Button 
          :variant="swapButtonVariant" 
          block 
          :disabled="!isSwapEnabled" 
          :loading="isSwapping"
          @click="handleSwap"
        >
          {{ swapButtonText }}
        </Button>
      </div>
    </Card>

    <TokenSelectModal
      v-if="isTokenSelectOpen"
      :tokens="coinList"
      :loading="isLoadingTokens"
      :selected-token="currentSelectType === 'from' ? fromToken : toToken"
      :other-selected-token="currentSelectType === 'from' ? toToken : fromToken"
      @select="selectToken"
      @close="closeTokenSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useVerusWallet } from '../../hooks/useVerusWallet';
import { getConversionRate } from '../../scripts/verusRpcInit';
import Card from '../ui/Card.vue';
import Button from '../ui/Button.vue';
import SwapInput from './SwapInput.vue';
import TokenSelectModal from './TokenSelectModal.vue';

// Get wallet functionality from the hook
const {
  isConnected,
  balances,
  currencies,
  connect,
  getCurrencies,
  refreshBalances,
  preconvertCurrency,
  error: walletError,
  loading: walletLoading
} = useVerusWallet();

// State
const fromToken = ref(null);
const toToken = ref(null);
const fromAmount = ref('');
const toAmount = ref('');
const coinList = ref([]);
const isLoadingTokens = ref(false);
const conversionRate = ref(null);
const isSwapping = ref(false);
const currentSelectType = ref(null);
const isTokenSelectOpen = ref(false);
const slippage = ref(0.5);
const customSlippage = ref('');
const deadline = ref(20);
const slippageOptions = [0.5, 1, 2, 3];

// Computed properties
const fromBalance = computed(() => {
  if (!fromToken.value) return '0';
  const id = fromToken.value.currencyid || fromToken.value.name;
  return balances.value[id] || '0';
});

const toBalance = computed(() => {
  if (!toToken.value) return '0';
  const id = toToken.value.currencyid || toToken.value.name;
  return balances.value[id] || '0';
});

const sortedCoinList = computed(() => {
  if (!coinList.value || !coinList.value.length) return [];
  
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

const isSwapEnabled = computed(() => {
  return isConnected.value && 
    fromToken.value && 
    toToken.value && 
    fromAmount.value && 
    parseFloat(fromAmount.value) > 0 && 
    parseFloat(fromAmount.value) <= parseFloat(fromBalance.value) &&
    !isSwapping.value &&
    !conversionRate.value?.error;
});

const swapButtonText = computed(() => {
  if (!isConnected.value) return 'Connect Wallet';
  if (!fromToken.value || !toToken.value) return 'Select Tokens';
  if (!fromAmount.value || parseFloat(fromAmount.value) <= 0) return 'Enter an Amount';
  if (parseFloat(fromAmount.value) > parseFloat(fromBalance.value)) return 'Insufficient Balance';
  if (conversionRate.value?.error) return 'Invalid Swap';
  if (isSwapping.value) return 'Swapping...';
  return 'Swap';
});

const swapButtonVariant = computed(() => {
  if (!isConnected.value) return 'secondary';
  if (!isSwapEnabled.value) return 'secondary';
  return 'gradient';
});

// Methods
const openTokenSelect = (type) => {
  currentSelectType.value = type;
  isTokenSelectOpen.value = true;
  fetchCoinList();
};

const closeTokenSelect = () => {
  isTokenSelectOpen.value = false;
  currentSelectType.value = null;
};

const fetchCoinList = async () => {
  try {
    isLoadingTokens.value = true;
    
    // If not connected, connect first
    if (!isConnected.value) {
      await connect();
    }
    
    // Get currencies from wallet
    await getCurrencies();
    
    // Use the currencies from the wallet hook
    coinList.value = currencies.value;
  } catch (error) {
    console.error('Error fetching coin list:', error);
  } finally {
    isLoadingTokens.value = false;
  }
};

const selectToken = (token) => {
  if (currentSelectType.value === 'from') {
    // If selecting the same token that's already in "to", swap them
    if (toToken.value && token.currencyid === toToken.value.currencyid) {
      toToken.value = fromToken.value;
    }
    fromToken.value = token;
  } else {
    // If selecting the same token that's already in "from", swap them
    if (fromToken.value && token.currencyid === fromToken.value.currencyid) {
      fromToken.value = toToken.value;
    }
    toToken.value = token;
  }
  
  closeTokenSelect();
  updateConversionRate();
};

const swapTokens = () => {
  if (fromToken.value && toToken.value) {
    const temp = fromToken.value;
    fromToken.value = toToken.value;
    toToken.value = temp;
    
    // Reset the amounts
    const tempAmount = fromAmount.value;
    fromAmount.value = '';
    toAmount.value = '';
    
    // Update conversion rate
    updateConversionRate();
  }
};

const updateConversionRate = async () => {
  if (!fromToken.value || !toToken.value || !fromAmount.value || parseFloat(fromAmount.value) <= 0) {
    conversionRate.value = null;
    toAmount.value = '';
    return;
  }

  try {
    const fromCurrency = fromToken.value.currencyid || fromToken.value.name;
    const toCurrency = toToken.value.currencyid || toToken.value.name;
    const amount = parseFloat(fromAmount.value);
    
    const rate = await getConversionRate(fromCurrency, toCurrency, amount);
    conversionRate.value = rate;
    
    if (rate.estimatedOutput) {
      toAmount.value = rate.estimatedOutput.toString();
    } else {
      toAmount.value = '';
    }
  } catch (error) {
    console.error('Error updating conversion rate:', error);
    conversionRate.value = { error: error.message };
    toAmount.value = '';
  }
};

const handleMaxAmount = () => {
  updateConversionRate();
};

const refreshData = async () => {
  try {
    await refreshBalances();
    await getCurrencies();
    updateConversionRate();
  } catch (error) {
    console.error('Error refreshing data:', error);
  }
};

const handleCustomSlippage = (event) => {
  const value = event.target.value;
  if (value === '') {
    slippage.value = 0.5; // Default
    return;
  }
  
  const numValue = parseFloat(value);
  if (!isNaN(numValue) && numValue > 0 && numValue <= 50) {
    slippage.value = numValue;
  }
};

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  if (isNaN(parseFloat(num))) return '0';
  
  return parseFloat(num).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  });
};

const formatConversionPath = (path) => {
  if (!path || !path.length) return 'Direct';
  return path.join(' → ');
};

const handleSwap = async () => {
  if (!isSwapEnabled.value) return;
  
  try {
    isSwapping.value = true;
    
    const result = await preconvertCurrency({
      fromCurrency: fromToken.value.currencyid || fromToken.value.name,
      toCurrency: toToken.value.currencyid || toToken.value.name,
      amount: fromAmount.value,
    });
    
    console.log('Swap result:', result);
    
    // Reset form after successful swap
    fromAmount.value = '';
    toAmount.value = '';
    conversionRate.value = null;
    
    // Refresh balances
    await refreshBalances();
  } catch (error) {
    console.error('Error performing swap:', error);
  } finally {
    isSwapping.value = false;
  }
};

// Watchers
watch([fromToken, toToken], () => {
  updateConversionRate();
});

watch(fromAmount, () => {
  updateConversionRate();
});

// Lifecycle hooks
onMounted(async () => {
  try {
    if (isConnected.value) {
      await refreshBalances();
      await fetchCoinList();
      
      // Set default tokens if available
      if (coinList.value && coinList.value.length) {
        // Try to find VRSCTEST or similar as first token
        const defaultFromToken = coinList.value.find(c => 
          c.name === 'VRSCTEST' || c.currencyid === 'VRSCTEST'
        ) || coinList.value[0];
        
        // Try to find another token for the "to" field
        const defaultToToken = coinList.value.find(c => 
          c.currencyid !== defaultFromToken.currencyid &&
          (c.name === 'SAILING' || c.currencyid === 'SAILING')
        ) || coinList.value.find(c => c.currencyid !== defaultFromToken.currencyid);
        
        fromToken.value = defaultFromToken;
        if (defaultToToken) {
          toToken.value = defaultToToken;
        }
      }
    }
  } catch (error) {
    console.error('Error initializing swap:', error);
  }
});
</script>

<style scoped>
.swap-container {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
}

.swap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.swap-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.swap-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: auto;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.action-button svg {
  display: block;
}

.swap-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.swap-direction {
  display: flex;
  justify-content: center;
  margin: -12px 0;
  position: relative;
  z-index: 5;
}

.swap-direction-button {
  background-color: var(--bg-card);
  border: 2px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.swap-direction-button:hover {
  background-color: var(--primary-color-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: scale(1.1);
}

.swap-direction-button svg {
  display: block;
  width: 24px;
  height: 24px;
  stroke-width: 2.5;
}

.conversion-details {
  background-color: var(--bg-elevated);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.conversion-details > div {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.conversion-details span:first-child {
  color: var(--text-secondary);
}

.conversion-details span:last-child {
  color: var(--text-primary);
  font-weight: 500;
}

.conversion-error {
  color: var(--error-color);
  text-align: center;
  padding: 8px;
  font-size: 14px;
  background-color: var(--error-bg);
  border-radius: 8px;
}
</style>
