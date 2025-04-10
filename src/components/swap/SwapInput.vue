<template>
  <div class="swap-input-container">
    <div class="swap-input-header">
      <label v-if="label" class="swap-input-label">{{ label }}</label>
      <button v-if="showMaxButton && max" class="max-button" @click="onMaxClick">MAX</button>
    </div>
    
    <div class="swap-input-main">
      <div class="amount-input-container">
        <input
          type="text"
          class="amount-input"
          :placeholder="placeholder || '0.0'"
          :value="modelValue"
          @input="handleInput"
          :disabled="disabled"
        />
      </div>
      
      <TokenSelect 
        :token="selectedToken" 
        :balance="max"
        :showBalance="true"
        @open-select="$emit('open-token-select')"
      />
    </div>
    
    <div class="swap-input-footer" v-if="showBalanceInfo">
      <div class="balance-info">
        <span class="balance-label">Balance: </span>
        <span class="balance-value">{{ formatBalance(max) }}</span>
      </div>
      <div class="dollar-value" v-if="dollarValue">
        <span>≈ ${{ dollarValue }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import TokenSelect from '../ui/TokenSelect.vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  selectedToken: {
    type: Object,
    default: null
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '0.0'
  },
  max: {
    type: String,
    default: '0'
  },
  showMaxButton: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showBalanceInfo: {
    type: Boolean,
    default: true
  },
  dollarValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'open-token-select', 'max']);

const handleInput = (event) => {
  const value = event.target.value;
  // Only allow numbers, a single decimal point, and valid amounts
  const regex = /^$|^[0-9]*\.?[0-9]*$/;
  if (regex.test(value)) {
    emit('update:modelValue', value);
  }
};

const onMaxClick = () => {
  if (props.max) {
    const maxValue = parseFloat(props.max).toString();
    emit('update:modelValue', maxValue);
    emit('max');
  }
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
</script>

<style scoped>
.swap-input-container {
  background-color: var(--bg-card);
  border-radius: 20px;
  padding: 16px;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.swap-input-container:hover {
  border-color: var(--border-hover);
}

.swap-input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.swap-input-label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.max-button {
  background-color: var(--bg-elevated);
  color: var(--primary-color);
  border: none;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.max-button:hover {
  background-color: var(--primary-color-light);
}

.swap-input-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.amount-input-container {
  flex: 1;
}

.amount-input {
  width: 100%;
  background: transparent;
  border: none;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  outline: none;
  padding: 0;
}

.amount-input::placeholder {
  color: var(--text-tertiary);
}

.swap-input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.balance-info {
  font-size: 14px;
  color: var(--text-secondary);
}

.balance-value {
  font-weight: 500;
}

.dollar-value {
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
