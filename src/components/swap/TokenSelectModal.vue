<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="token-select-modal">
      <div class="modal-header">
        <h3>Select a Token</h3>
        <button class="close-button" @click="$emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="search-container">
        <input 
          type="text" 
          placeholder="Search by name or currency ID" 
          v-model="searchQuery"
          class="search-input"
        />
      </div>
      
      <div class="token-list-container">
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading tokens...</p>
        </div>
        
        <div v-else-if="filteredTokens.length === 0" class="no-tokens">
          <p>No tokens found matching "{{ searchQuery }}"</p>
        </div>
        
        <div v-else class="token-list">
          <div 
            v-for="token in filteredTokens" 
            :key="token.currencyid || token.name"
            class="token-item"
            :class="{ 'selected': isSelected(token), 'disabled': isOtherSelected(token) }"
            @click="selectToken(token)"
          >
            <div class="token-icon" v-if="token.logo">
              <img :src="token.logo" :alt="token.name" />
            </div>
            <div v-else class="token-icon token-placeholder">
              {{ token.name?.slice(0, 2) || token.currencyid?.slice(0, 2) || '??' }}
            </div>
            
            <div class="token-details">
              <div class="token-name-row">
                <span class="token-name">{{ token.name || token.currencyid }}</span>
                <span v-if="token.issystemcurrency" class="token-badge system">System</span>
                <span v-if="token.isconvertible" class="token-badge convertible">Convertible</span>
              </div>
              
              <div class="token-id">{{ token.currencyid }}</div>
            </div>
            
            <div class="token-balance">
              {{ formatBalance(token.balance) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  tokens: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedToken: {
    type: Object,
    default: null
  },
  otherSelectedToken: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['select', 'close']);

const searchQuery = ref('');

const filteredTokens = computed(() => {
  if (!props.tokens) return [];
  if (!searchQuery.value) return props.tokens;
  
  const query = searchQuery.value.toLowerCase();
  return props.tokens.filter(token => {
    const name = (token.name || '').toLowerCase();
    const id = (token.currencyid || '').toLowerCase();
    return name.includes(query) || id.includes(query);
  });
});

const isSelected = (token) => {
  if (!props.selectedToken) return false;
  return token.currencyid === props.selectedToken.currencyid;
};

const isOtherSelected = (token) => {
  if (!props.otherSelectedToken) return false;
  return token.currencyid === props.otherSelectedToken.currencyid;
};

const selectToken = (token) => {
  if (isOtherSelected(token)) return; // Prevent selecting the same token
  emit('select', token);
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

// Focus search input when modal opens
onMounted(() => {
  document.querySelector('.search-input')?.focus();
});
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
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.token-select-modal {
  background-color: var(--bg-card);
  border-radius: 24px;
  width: 100%;
  max-width: 420px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-button {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: var(--bg-elevated);
}

.search-container {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-input);
  color: var(--text-primary);
  font-size: 16px;
  outline: none;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color-light);
}

.token-list-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px 0;
  max-height: 50vh;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(95, 76, 230, 0.3);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

.no-tokens {
  text-align: center;
  padding: 32px;
  color: var(--text-secondary);
}

.token-list {
  display: flex;
  flex-direction: column;
}

.token-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.token-item:hover {
  background-color: var(--bg-hover);
}

.token-item.selected {
  background-color: var(--primary-color-light);
}

.token-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.token-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.token-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.token-placeholder {
  background-color: var(--bg-elevated);
  color: var(--text-secondary);
  font-weight: 600;
}

.token-details {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.token-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.token-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.token-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
}

.token-badge.system {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.token-badge.convertible {
  background-color: rgba(95, 76, 230, 0.1);
  color: var(--primary-color);
}

.token-id {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.token-balance {
  font-weight: 500;
  color: var(--text-primary);
  min-width: 80px;
  text-align: right;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
