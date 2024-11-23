<!-- src/views/WalletPage.vue -->
<template>
  <div class="main-content">
    <h1>Wallet Page</h1>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="{ active: activeTab === 'Verus' }" @click="setActiveTab('Verus')">Verus</button>
      <button :class="{ active: activeTab === 'Ethereum' }" @click="setActiveTab('Ethereum')">Ethereum</button>
    </div>

    <!-- Tab Content -->
    <div v-if="activeTab === 'Verus'" class="tab-content verus-tab">
      <div class="tab-header">
        <h2>Verus Currencies</h2>
        <div class="filter-controls">
          <label class="filter-toggle">
            <input type="checkbox" v-model="showOnlyWithBalance">
            Show only currencies with balance
          </label>
          <button @click="refreshBalances" class="refresh-button" :disabled="loading">
            <i class="fas fa-sync" :class="{ 'fa-spin': loading }"></i>
            Refresh
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Loading currencies...</span>
      </div>
      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ error }}</span>
        <button @click="fetchVerusCurrencies" class="retry-button">
          <i class="fas fa-redo"></i> Retry
        </button>
      </div>
      <div v-else class="currencies-grid">
        <div v-for="currency in filteredCurrencies" 
             :key="currency.currencyid" 
             class="currency-card"
             :class="{ 'has-balance': currency.balance > 0 }">
          <div class="currency-header">
            <h3>{{ currency.name || currency.currencyid }}</h3>
            <span class="currency-balance" :class="{ 'positive-balance': currency.balance > 0 }">
              {{ formatNumber(currency.balance) }} {{ currency.name }}
            </span>
          </div>
          <div class="currency-details">
            <div class="detail-item">
              <span class="label">Balance:</span>
              <span class="value" :class="{ 'positive-balance': currency.balance > 0 }">
                {{ formatNumber(currency.balance) }} {{ currency.name }}
              </span>
            </div>
            <div class="detail-item">
              <span class="label">Currency ID:</span>
              <span class="value">{{ currency.currencyid }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Parent:</span>
              <span class="value">{{ currency.parent ? currency.parent.substring(0, 10) + '...' : 'None' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">System ID:</span>
              <span class="value">{{ currency.systemid ? currency.systemid.substring(0, 10) + '...' : 'None' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Supply:</span>
              <span class="value">{{ formatNumber(currency.supply) }}</span>
            </div>
            <div class="detail-item" v-if="currency.privatesupply">
              <span class="label">Private Supply:</span>
              <span class="value">{{ formatNumber(currency.privatesupply) }}</span>
            </div>
            <div class="detail-item" v-if="currency.reserve">
              <span class="label">Reserve:</span>
              <span class="value">{{ formatNumber(currency.reserve) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'Ethereum'" class="tab-content">
      <h2>Ethereum Wallet</h2>
      <p v-if="walletAddress">Address: {{ walletAddress }}</p>
      <p v-else>No wallet connected</p>
      <ul v-if="balances.length">
        <li v-for="(balance, index) in balances" :key="index">
          {{ balance.token }}: {{ balance.amount }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { listCurrencies, getAllCurrencyBalances } from '../scripts/verusRpcInit';
import MetaMaskService from '../scripts/metaMaskLogin';

const activeTab = ref('Verus');
const currencies = ref([]);
const loading = ref(false);
const error = ref(null);
const walletAddress = ref(null);
const balances = ref([]);
const showOnlyWithBalance = ref(false);

const metaMaskService = new MetaMaskService();

const filteredCurrencies = computed(() => {
  if (showOnlyWithBalance.value) {
    return currencies.value.filter(currency => currency.balance > 0);
  }
  return currencies.value;
});

const setActiveTab = (tab) => {
  activeTab.value = tab;
  if (tab === 'Verus') {
    fetchVerusCurrencies();
  } else if (tab === 'Ethereum') {
    fetchEthereumBalances();
  }
};

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0.00000000';
  const parsedNum = parseFloat(num);
  if (isNaN(parsedNum)) return '0.00000000';
  return parsedNum.toFixed(8); // Always show 8 decimal places for cryptocurrency
};

const refreshBalances = async () => {
  console.log('Refreshing balances...');
  await fetchVerusCurrencies();
};

const fetchVerusCurrencies = async () => {
  loading.value = true;
  error.value = null;
  try {
    console.log('Fetching currencies with balances...');
    const result = await getAllCurrencyBalances();
    console.log('Received currencies with balances:', result);
    
    // Filter out currencies with no definition
    currencies.value = result
      .filter(currency => currency.name) // Only include currencies with names
      .sort((a, b) => {
        // Sort by balance first (higher balances first)
        const balanceA = parseFloat(a.balance) || 0;
        const balanceB = parseFloat(b.balance) || 0;
        if (balanceB !== balanceA) {
          return balanceB - balanceA;
        }
        // Then sort by name
        return (a.name || a.currencyid).localeCompare(b.name || b.currencyid);
      });
    
    console.log('Sorted currencies:', currencies.value);
  } catch (err) {
    error.value = 'Failed to load currencies. Please try again.';
    console.error('Error fetching currencies:', err);
  } finally {
    loading.value = false;
  }
};

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
  fetchVerusCurrencies();
});
</script>

<style scoped>
.main-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--input-border-color);
  padding-bottom: 1rem;
}

.tabs button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: var(--text-color-secondary);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.tabs button:hover {
  background: var(--hover-bg);
}

.tabs button.active {
  background: var(--button-bg);
  color: var(--button-text-color);
}

.currencies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}

.currency-card {
  background: var(--card-bg);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--input-border-color);
  transition: transform 0.2s, box-shadow 0.2s;
}

.currency-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.currency-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--input-border-color);
}

.currency-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-color);
}

.currency-id {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  display: block;
  margin-top: 0.25rem;
}

.currency-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.value {
  font-weight: 500;
  color: var(--text-color);
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
}

.loading-state i, .error-state i {
  font-size: 2rem;
}

.retry-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  background: var(--button-bg);
  color: var(--button-text-color);
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.retry-button:hover {
  opacity: 0.9;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.refresh-button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background: var(--button-bg);
  color: var(--button-text-color);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.currency-balance {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--text-color-primary);
}

.positive-balance {
  color: var(--success-color);
  font-weight: bold;
}

.has-balance {
  border-color: var(--success-color);
}

.currency-card .currency-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 768px) {
  .currencies-grid {
    grid-template-columns: 1fr;
  }
  
  .main-content {
    padding: 1rem;
  }
}
</style>
