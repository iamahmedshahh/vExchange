<template>
  <div class="token-select" @click="$emit('open-select')">
    <div v-if="token" class="token-selected">
      <div class="token-icon" v-if="token.logo">
        <img :src="token.logo" :alt="token.name" />
      </div>
      <div v-else class="token-icon token-placeholder">
        {{ token.name?.slice(0, 2) || token.currencyid?.slice(0, 2) || '??' }}
      </div>
      <div class="token-info">
        <div class="token-name">{{ token.name || token.currencyid }}</div>
        <div class="token-balance" v-if="showBalance">
          Balance: {{ formatBalance(balance) }}
        </div>
      </div>
    </div>
    <div v-else class="token-select-placeholder">
      <div class="token-icon token-placeholder">?</div>
      <div class="token-placeholder-text">Select Token</div>
    </div>
    <div class="token-select-arrow">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>
  </div>
</template>

<script setup>
defineProps({
  token: {
    type: Object,
    default: null
  },
  balance: {
    type: String,
    default: '0'
  },
  showBalance: {
    type: Boolean,
    default: true
  }
});

defineEmits(['open-select']);

const formatBalance = (balance) => {
  if (!balance) return '0';
  const num = parseFloat(balance);
  if (num === 0) return '0';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  });
};
</script>

<style scoped>
.token-select {
  display: flex;
  align-items: center;
  background-color: var(--bg-input);
  border-radius: 16px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
  min-width: 140px;
  user-select: none;
}

.token-select:hover {
  border-color: var(--primary-color);
  background-color: var(--bg-hover);
}

.token-selected, .token-select-placeholder {
  display: flex;
  align-items: center;
  flex: 1;
}

.token-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
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
  font-size: 14px;
}

.token-info {
  display: flex;
  flex-direction: column;
}

.token-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
}

.token-balance {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.token-placeholder-text {
  font-weight: 600;
  color: var(--text-secondary);
}

.token-select-arrow {
  margin-left: 12px;
  color: var(--text-secondary);
}
</style>
