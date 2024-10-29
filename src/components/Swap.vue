<template>
  <div class="swap-container">
    <h2>Swap anytime, anywhere.</h2>
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
import { ref, onMounted } from 'vue';
import SwapField from './SwapField.vue';
import CoinModal from './CoinModal.vue';

const sellCoin = ref(null);
const buyCoin = ref(null);
const isModalOpen = ref(false);
const isLoading = ref(true);
const coinList = ref([]);
const selectedField = ref('');

function openModal(field) {
  selectedField.value = field;
  isModalOpen.value = true;
  fetchCoins();
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
  isLoading.value = true;
  // Simulate API call
  setTimeout(() => {
    coinList.value = [
      { name: 'ETH', logo: 'path-to-eth-logo' },
      { name: '1INCH', logo: 'path-to-1inch-logo' },
      // More coins
    ];
    isLoading.value = false;
  }, 2000);
}
</script>

