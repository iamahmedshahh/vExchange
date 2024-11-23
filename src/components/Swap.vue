<template>
  <div class="swap-container">
    <h2>Swap Between Bridges</h2>
    <SwapField 
      label="Sell" 
      :selectedCoin="sellCoin" 
      v-model:value="sellAmount"
      @openModal="openModal('sell')" 
    />
    <div v-if="conversionRate" class="conversion-info">
      <p>1 {{ sellCoin?.name }} = {{ conversionRate.rate }} {{ buyCoin?.name }}</p>
      <p v-if="conversionRate.fees">Fee: {{ (conversionRate.fees * 100).toFixed(2) }}%</p>
    </div>
    <SwapField 
      label="Buy" 
      :selectedCoin="buyCoin" 
      :value="buyAmount"
      @openModal="openModal('buy')" 
    />
    <button class="swap-button" @click="initiateSwap" :disabled="!isLoggedIn || !sellCoin || !buyCoin || !sellAmount">
      {{ getButtonText() }}
    </button>
    <SwapProgress v-if="isLoggedIn" ref="swapProgressRef" :isLoggedIn="isLoggedIn" />
    <CoinModal
      v-if="isModalOpen"
      :loading="isLoading"
      :coinList="coinList"
      @selectCoin="selectCoin"
      @closeModal="closeModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import SwapField from './SwapField.vue';
import CoinModal from './CoinModal.vue';
import SwapProgress from './SwapProgress.vue';
import { listCurrencies, sendCrossChain, getConversionRate, checkCurrencyBalance } from '../scripts/verusRpcInit';
import { useUserStore } from '../stores/userStore';

const userStore = useUserStore();
const isLoggedIn = computed(() => userStore.isLoggedIn);
const sellCoin = ref(null);
const buyCoin = ref(null);
const isModalOpen = ref(false);
const isLoading = ref(false); // Start as false, loading state will be managed in fetchCoins
const coinList = ref([]);
const selectedField = ref('');
const swapProgressRef = ref(null);
const conversionRate = ref(null);
const sellAmount = ref('');
const buyAmount = ref('');
const errorMessage = ref('');

// Watch for changes in selected coins to update conversion rate
watch([sellCoin, buyCoin], async ([newSell, newBuy]) => {
  if (newSell && newBuy) {
    try {
      const rates = await getConversionRate(newSell.name, newBuy.name);
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

// Watch for changes in login state to verify iAddress
watch(() => isLoggedIn.value, async (newLoginState) => {
  if (newLoginState) {
    const iaddress = localStorage.getItem('iaddress');
    console.log('Current logged in iAddress:', iaddress);
    
    if (iaddress) {
      try {
        // Check initial balance when logged in
        const balanceInfo = await checkCurrencyBalance('VRSCTEST');
        console.log('Initial VRSCTEST balance check:', balanceInfo);
      } catch (error) {
        console.error('Error checking initial balance:', error);
      }
    }
  }
});

function getButtonText() {
  if (!isLoggedIn.value) return 'Please Login with VerusID';
  if (!sellCoin.value || !buyCoin.value) return 'Select tokens';
  if (!sellAmount.value) return 'Enter amount';
  if (errorMessage.value) return errorMessage.value;
  return 'Swap Now';
}

function openModal(field) {
  selectedField.value = field;
  isModalOpen.value = true;
  fetchCoins(); // Fetch coins when opening the modal
}

function closeModal() {
  isModalOpen.value = false;
}

function selectCoin(coin) {
  if (selectedField.value === 'sell') {
    sellCoin.value = coin;
  } else {
    buyCoin.value = coin;
  }
  closeModal();
}

async function fetchCoins() {
  isLoading.value = true; // Set loading to true when starting the fetch
  try {
    const response = await listCurrencies();
    console.log("Response data:", response); // Check the structure of the response

    if (response && Array.isArray(response)) {
      coinList.value = response.map((coin) => ({
        name: coin.currencydefinition?.name || "Unknown", 
        logo: "path/to/default/logo.png", // Update this path as needed
      }));
    } else {
      console.error("Response is missing expected properties:", response);
    }
  } catch (error) {
    console.error("Error fetching coin list:", error);
  } finally {
    isLoading.value = false; // Set loading to false after fetching
  }
}

const checkBalance = async () => {
  const iaddress = localStorage.getItem('iaddress');
  if (!iaddress) {
    console.error('No iaddress found');
    return false;
  }

  try {
    const balanceCheck = await checkCurrencyBalance(iaddress, sellCoin.value.name);
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
    const result = await sendCrossChain({
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
