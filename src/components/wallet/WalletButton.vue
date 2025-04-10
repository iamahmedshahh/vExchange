<template>
  <div class="wallet-button-container">
    <button
      v-if="!isConnected" 
      class="connect-button"
      @click="connectWallet"
      :disabled="loading"
    >
      <span v-if="loading" class="loading-spinner"></span>
      <span v-else>Connect Wallet</span>
    </button>
    
    <div v-else class="wallet-info" @click="toggleDropdown">
      <div class="address-display">
        <div class="status-indicator connected"></div>
        <span class="address">{{ shortenAddress(address) }}</span>
      </div>
      
      <div v-if="showDropdown" class="wallet-dropdown">
        <div class="dropdown-header">
          <div class="wallet-title">Verus Wallet</div>
          <div class="full-address">{{ address }}</div>
          <button class="copy-button" @click.stop="copyAddress">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
        
        <div class="balance-list">
          <div v-if="balanceList.length === 0" class="no-balances">
            No balances found
          </div>
          <div v-else>
            <div 
              v-for="item in balanceList" 
              :key="item.id"
              class="balance-item"
            >
              <div class="balance-token">
                <div class="token-icon token-placeholder">
                  {{ item.name.slice(0, 2) }}
                </div>
                <div class="token-name">{{ item.name }}</div>
              </div>
              <div class="balance-amount">{{ formatBalance(item.balance) }}</div>
            </div>
          </div>
        </div>
        
        <div class="dropdown-actions">
          <router-link to="/wallet" class="action-button wallet-button" @click.native="showDropdown = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            Wallet
          </router-link>
          
          <button class="action-button disconnect-button" @click.stop="disconnectWallet">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Disconnect
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useVerusWallet } from '../../hooks/useVerusWallet';

const { 
  isConnected, 
  address, 
  balances, 
  currencies,
  connect, 
  disconnect,
  refreshBalances,
  loading: walletLoading
} = useVerusWallet();

const showDropdown = ref(false);
const loading = ref(false);

// Limit balances to show in dropdown
const balanceList = computed(() => {
  if (!balances.value || !currencies.value) return [];
  
  // Create balance items array with name and balances
  const items = Object.entries(balances.value).map(([currencyId, balance]) => {
    // Find currency by ID to get proper name
    const currency = currencies.value.find(c => 
      c.currencyid === currencyId || c.name === currencyId
    );
    
    return {
      id: currencyId,
      name: currency?.name || currencyId,
      balance: balance
    };
  });
  
  // Sort by balance (highest first) and limit to top 5
  return items
    .filter(item => parseFloat(item.balance) > 0)
    .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
    .slice(0, 5);
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

const disconnectWallet = async () => {
  try {
    showDropdown.value = false;
    await disconnect();
  } catch (error) {
    console.error('Disconnect error:', error);
  }
};

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const shortenAddress = (addr) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  const container = document.querySelector('.wallet-info');
  if (container && !container.contains(event.target)) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.wallet-button-container {
  position: relative;
}

.connect-button {
  background: var(--primary-gradient, linear-gradient(135deg, #5f4ce6 0%, #8070ff 100%));
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0 20px;
  height: 40px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.connect-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.connect-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.wallet-info {
  background-color: var(--bg-elevated);
  border-radius: 12px;
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
}

.wallet-info:hover {
  border-color: var(--primary-color);
  background-color: var(--bg-hover);
}

.address-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.connected {
  background-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.address {
  font-weight: 600;
  font-size: 14px;
}

.wallet-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background-color: var(--bg-card);
  border-radius: 16px;
  width: 320px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  z-index: 100;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.dropdown-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  position: relative;
}

.wallet-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.full-address {
  font-size: 14px;
  color: var(--text-secondary);
  word-break: break-all;
  margin-right: 24px;
}

.copy-button {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.balance-list {
  padding: 16px;
  max-height: 240px;
  overflow-y: auto;
  border-bottom: 1px solid var(--border-color);
}

.no-balances {
  text-align: center;
  color: var(--text-secondary);
  padding: 16px 0;
  font-size: 14px;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.balance-token {
  display: flex;
  align-items: center;
  gap: 8px;
}

.token-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.token-placeholder {
  background-color: var(--bg-elevated);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 12px;
}

.token-name {
  font-weight: 500;
}

.balance-amount {
  font-weight: 600;
}

.dropdown-actions {
  padding: 16px;
  display: flex;
  gap: 12px;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.wallet-button {
  background-color: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.wallet-button:hover {
  background-color: var(--bg-hover);
}

.disconnect-button {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: none;
}

.disconnect-button:hover {
  background-color: rgba(239, 68, 68, 0.2);
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
