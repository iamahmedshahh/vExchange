<template>
  <div class="wallet-container">
    <h1 class="wallet-title">Wallet Overview</h1>
    
    <div v-if="!isConnected" class="connect-prompt">
      <div class="connect-card">
        <div class="connect-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
        </div>
        <h2>Connect Your Wallet</h2>
        <p>Connect your Verus wallet to view balances and manage your assets.</p>
        <button class="connect-button" @click="connectWallet" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>Connect Wallet</span>
        </button>
      </div>
    </div>
    
    <div v-else class="wallet-content">
      <div class="wallet-header">
        <div class="wallet-address">
          <span class="address-label">Connected Address</span>
          <div class="address-display">
            <span class="address">{{ address }}</span>
            <button class="copy-button" @click="copyAddress">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <button class="refresh-button" @click="refreshBalances" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"></path>
          </svg>
          Refresh
        </button>
      </div>
      
      <div class="balances-container">
        <h2 class="section-title">Your Assets</h2>
        
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner large"></div>
          <p>Loading your balances...</p>
        </div>
        
        <div v-else-if="tokenList.length === 0" class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>No assets found in this wallet</p>
        </div>
        
        <div v-else class="token-list">
          <div v-for="token in tokenList" :key="token.id" class="token-card">
            <div class="token-info">
              <div class="token-icon">
                <div class="token-placeholder">{{ token.symbol }}</div>
              </div>
              <div class="token-details">
                <div class="token-name">{{ token.name }}</div>
                <div class="token-id">{{ shortenId(token.id) }}</div>
              </div>
            </div>
            <div class="token-balance">
              <div class="token-amount">{{ formatBalance(token.balance) }}</div>
              <div class="token-value" v-if="token.usdValue">≈ ${{ formatUsdValue(token.usdValue) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useVerusWallet } from '../hooks/useVerusWallet';

const {
  isConnected,
  address,
  balances,
  currencies,
  getBalance,
  connect,
  refreshBalances,
  loading: walletLoading
} = useVerusWallet();

const loading = ref(false);

// Compute token list with name, symbol, balance, etc.
const tokenList = computed(() => {
  if (!balances.value || !currencies.value) return [];
  
  // Create token items array with details
  const items = Object.entries(balances.value).map(([currencyId, balance]) => {
    // Find currency by ID to get proper name
    const currency = currencies.value.find(c => 
      c.currencyid === currencyId || c.name === currencyId
    );
    
    const symbol = currency?.name?.slice(0, 2).toUpperCase() || 'XX';
    
    return {
      id: currencyId,
      name: currency?.name || currencyId,
      symbol: symbol,
      balance: balance,
      usdValue: parseFloat(balance) * 2.5 // Mock USD value - in real app would use exchange rates
    };
  });
  
  // Sort by USD value (highest first)
  return items
    .filter(item => parseFloat(item.balance) > 0)
    .sort((a, b) => parseFloat(b.usdValue) - parseFloat(a.usdValue));
});

const connectWallet = async () => {
  try {
    loading.value = true;
    await connect();
    await refreshBalances();
  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    loading.value = false;
  }
};

const copyAddress = () => {
  if (!address.value) return;
  
  navigator.clipboard.writeText(address.value)
    .then(() => {
      // Show copy success feedback
      const button = document.querySelector('.copy-button');
      button.classList.add('copied');
      setTimeout(() => {
        button.classList.remove('copied');
      }, 2000);
    })
    .catch(err => {
      console.error('Could not copy address:', err);
    });
};

const formatBalance = (balance) => {
  if (!balance) return '0';
  const num = parseFloat(balance);
  if (num === 0) return '0';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  });
};

const formatUsdValue = (value) => {
  if (!value) return '0.00';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const shortenId = (id) => {
  if (!id) return '';
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}...${id.slice(-8)}`;
};

onMounted(async () => {
  if (isConnected.value) {
    await refreshBalances();
  }
});
</script>

<style scoped>
.wallet-container {
  padding: 24px 0;
  max-width: 900px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-out;
}

.wallet-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 32px;
  color: var(--text-primary);
}

.connect-prompt {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.connect-card {
  background-color: var(--bg-card);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
  text-align: center;
  max-width: 400px;
  border: 1px solid var(--border-color);
}

.connect-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--primary-color-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.connect-card h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
}

.connect-card p {
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.connect-button {
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0 24px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.connect-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.connect-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.wallet-content {
  animation: slideUp 0.5s ease-out;
}

.wallet-header {
  background-color: var(--bg-card);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--border-color);
}

.address-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  display: block;
}

.address-display {
  display: flex;
  align-items: center;
  background-color: var(--bg-elevated);
  border-radius: 8px;
  padding: 8px 12px;
}

.address {
  font-family: monospace;
  font-size: 14px;
  word-break: break-all;
  margin-right: 12px;
}

.copy-button {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.copy-button:hover {
  color: var(--text-primary);
  background-color: var(--bg-hover);
}

.copy-button.copied::after {
  content: "Copied!";
  position: absolute;
  top: -30px;
  right: 0;
  background-color: var(--bg-elevated);
  color: var(--text-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-button:hover {
  background-color: var(--bg-hover);
}

.refresh-button svg {
  transition: transform 0.3s ease;
}

.refresh-button:hover svg {
  transform: rotate(180deg);
}

.balances-container {
  background-color: var(--bg-card);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 24px;
}

.loading-state, .empty-state {
  padding: 48px;
  text-align: center;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin: 0 auto;
}

.loading-spinner.large {
  width: 40px;
  height: 40px;
  border: 3px solid var(--bg-hover);
  border-top-color: var(--primary-color);
  margin-bottom: 16px;
}

.empty-state svg {
  color: var(--text-tertiary);
  margin-bottom: 16px;
}

.token-list {
  display: grid;
  gap: 16px;
}

.token-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  background-color: var(--bg-elevated);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.token-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
  background-color: var(--bg-hover);
}

.token-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.token-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
}

.token-placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--primary-color-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.token-details {
  display: flex;
  flex-direction: column;
}

.token-name {
  font-weight: 600;
  font-size: 16px;
}

.token-id {
  font-family: monospace;
  font-size: 12px;
  color: var(--text-secondary);
}

.token-balance {
  text-align: right;
}

.token-amount {
  font-weight: 600;
  font-size: 16px;
}

.token-value {
  font-size: 14px;
  color: var(--text-secondary);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .wallet-container {
    padding: 16px;
  }
  
  .wallet-title {
    font-size: 24px;
    margin-bottom: 24px;
  }
  
  .wallet-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .refresh-button {
    width: 100%;
    justify-content: center;
  }
  
  .token-card {
    padding: 12px;
  }
  
  .token-icon {
    width: 32px;
    height: 32px;
  }
  
  .token-name, .token-amount {
    font-size: 14px;
  }
  
  .token-id, .token-value {
    font-size: 12px;
  }
}
</style>
