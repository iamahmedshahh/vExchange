<template>
  <div class="swap-container">
    <h2>Swap Between Bridges</h2>
    <SwapField label="Sell" :selectedCoin="sellCoin" @openModal="openModal('sell')" />
    <SwapField label="Buy" :selectedCoin="buyCoin" @openModal="openModal('buy')" />
    <button class="swap-button">Get started</button>
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
import { ref } from 'vue';
import SwapField from './SwapField.vue';
import CoinModal from './CoinModal.vue';
import { listCurrencies } from '../scripts/verusRpcInit';

const sellCoin = ref(null);
const buyCoin = ref(null);
const isModalOpen = ref(false);
const isLoading = ref(false); // Start as false, loading state will be managed in fetchCoins
const coinList = ref([]);
const selectedField = ref('');

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

</script>

