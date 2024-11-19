<!-- src/views/WalletPage.vue -->
<template>
  <div class="main-content">
    <h1>Wallet Page</h1>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="{ active: activeTab === 'Ethereum' }" @click="activeTab = 'Ethereum'">Ethereum</button>
      <button :class="{ active: activeTab === 'Verus' }" @click="activeTab = 'Verus'">Verus</button>
    </div>

    <!-- Tab Content -->
    <div v-if="activeTab === 'Ethereum'">
      <h2>Ethereum Wallet</h2>
      <p v-if="walletAddress">Address: {{ walletAddress }}</p>
      <p v-else>No wallet connected</p>
      <ul v-if="balances.length">
        <li v-for="(balance, index) in balances" :key="index">
          {{ balance.token }}: {{ balance.amount }}
        </li>
      </ul>
    </div>

    <div v-else-if="activeTab === 'Verus'">
      <h2>Verus Wallet</h2>
      <p>Verus wallet balances go here.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import MetaMaskService from '../scripts/metaMaskLogin'; // Adjust path if needed

const activeTab = ref('Ethereum');
const walletAddress = ref(null);
const balances = ref([]);

const metaMaskService = new MetaMaskService();

// Fetch Ethereum wallet address and balances
const fetchEthereumBalances = async () => {
  walletAddress.value = await metaMaskService.connect();
  if (walletAddress.value) {
    // Fetch token balances here (mock data for illustration)
    balances.value = [
      { token: 'ETH', amount: '1.5' },
      { token: 'DAI', amount: '100' }
    ];
  }
};

onMounted(() => {
  if (activeTab.value === 'Ethereum') fetchEthereumBalances();
});
</script>

<style scoped>
.main-content {
  padding: 20px;
}

.tabs button {
  margin-right: 10px;
  padding: 10px;
  cursor: pointer;
}

.tabs .active {
  font-weight: bold;
  border-bottom: 2px solid blue;
}
</style>
