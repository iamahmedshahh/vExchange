<template>
  <button 
    :class="[
      'btn', 
      `btn-${variant}`, 
      { 'btn-block': block, 'btn-disabled': disabled }
    ]" 
    :disabled="disabled" 
    @click="$emit('click')"
  >
    <div v-if="loading" class="btn-spinner"></div>
    <slot v-else></slot>
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'text', 'gradient', 'outline'].includes(value)
  },
  block: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['click']);
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  outline: none;
  min-height: 48px;
  position: relative;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  background: var(--primary-gradient, linear-gradient(135deg, #5f4ce6 0%, #8070ff 100%));
  color: white;
}

.btn-secondary {
  background-color: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-gradient {
  background: linear-gradient(135deg, #5f4ce6 0%, #10b981 100%);
  color: white;
}

.btn-outline {
  background-color: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}

.btn-text {
  background-color: transparent;
  color: var(--primary-color);
  padding: 8px 16px;
}

.btn-text:hover {
  background-color: rgba(95, 76, 230, 0.1);
  box-shadow: none;
}

.btn-block {
  width: 100%;
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-spinner {
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
