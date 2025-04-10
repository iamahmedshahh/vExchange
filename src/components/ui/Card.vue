<template>
  <div class="card" :class="{ 'card-hover': hover, [`card-${variant}`]: true }">
    <slot></slot>
  </div>
</template>

<script setup>
defineProps({
  hover: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'elevated', 'outlined'].includes(value)
  }
});
</script>

<style scoped>
.card {
  background-color: var(--bg-card);
  border-radius: 24px;
  padding: 24px;
  transition: all 0.2s ease;
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-default {
  background-color: var(--bg-card);
}

.card-elevated {
  background-color: var(--bg-elevated);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.card-outlined {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
}
</style>
