<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <div class="modal-header">
        <h3>Select Token</h3>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>

      <div v-if="loading" class="loading">
        <span class="loading-spinner"></span>
        <span>Loading currencies...</span>
      </div>

      <div v-else-if="!coinList || coinList.length === 0" class="empty-state">
        <span>No currencies available</span>
        <small v-if="errorMessage" class="error-message">{{ errorMessage }}</small>
      </div>

      <div v-else>
        <div class="debug-info" style="padding: 10px; font-size: 12px; color: #666;">
          Available coins: {{ coinList.length }}
        </div>
        
        <ul class="m-ul">
          <li v-for="coin in sortedCoinList" 
              :key="coin.currencyid" 
              @click="selectCoin(coin)" 
              class="m-li"
              :class="{ 'has-balance': hasBalance(coin), 'selected': coin.selected }">
            <div class="coin-info">
              <img :src="coin.logo" 
                   :alt="coin.name" 
                   class="coin-logo" 
                   @error="handleImageError"
                   :key="coin.currencyid" />
              <div class="coin-details">
                <span class="coin-name">{{ coin.name }}</span>
              </div>
            </div>
            <div class="coin-balance">
              <span class="balance-amount">{{ formatBalance(coin.balance) }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue';
import { useVerusWallet } from '../hooks/useVerusWallet';

const { balances } = useVerusWallet();
const defaultLogo = '/src/assets/default_coin.png';

const props = defineProps({
  loading: Boolean,
  coinList: {
    type: Array,
    default: () => []
  },
  errorMessage: {
    type: String,
    default: ''
  }
});

// Sort coins by balance
const sortedCoinList = computed(() => {
  if (!props.coinList) return [];
  
  return [...props.coinList].sort((a, b) => {
    const balanceA = parseFloat(a.balance || '0');
    const balanceB = parseFloat(b.balance || '0');
    if (balanceB === balanceA) {
      // If balances are equal, sort by name
      return a.name.localeCompare(b.name);
    }
    return balanceB - balanceA; // Sort in descending order
  });
});

const emit = defineEmits(['selectCoin', 'closeModal']);

function hasBalance(coin) {
  if (!coin.balance) return false;
  const balance = parseFloat(coin.balance);
  return balance > 0;
}

function handleImageError(event) {
  event.target.src = defaultLogo;
}

function formatBalance(balance) {
  if (!balance) return '0';
  const num = parseFloat(balance);
  if (num === 0) return '0';
  if (num < 0.00001) return '< 0.00001';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5
  });
}

function selectCoin(coin) {
  console.log('Selecting coin:', coin);
  emit('selectCoin', coin);
}

function closeModal() {
  emit('closeModal');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-color);
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-color);
}

.m-ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.m-li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.m-li:hover {
  background-color: var(--hover-color);
}

.m-li.selected {
  background-color: var(--selected-color);
}

.coin-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.coin-logo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.coin-details {
  display: flex;
  flex-direction: column;
}

.coin-name {
  font-weight: bold;
}

.coin-id {
  font-size: 0.8em;
  color: var(--secondary-text-color);
}

.coin-balance {
  text-align: right;
}

.balance-amount {
  font-weight: bold;
  display: block;
}

.balance-currency {
  font-size: 0.8em;
  color: var(--secondary-text-color);
}

.loading, .empty-state {
  text-align: center;
  padding: 20px;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

.error-message {
  color: var(--error-color);
  display: block;
  margin-top: 8px;
}

.has-balance {
  border: 1px solid var(--accent-color);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>