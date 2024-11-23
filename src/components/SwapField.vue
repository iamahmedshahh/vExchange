<template>
    <div class="swap-field">
      <label>{{ label }}</label>
      <div class="input-group-swap">
        <input 
          type="text" 
          :value="value"
          @input="$emit('update:value', $event.target.value)"
          placeholder="0" 
        />
        <button @click="openModal" class="coin-select">
          <img v-if="selectedCoin" :src="selectedCoin.logo" alt="Coin logo" class="coin-logo" />
          {{ selectedCoin ? selectedCoin.name : 'Select token' }}
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  
  const props = defineProps({
    label: String,
    selectedCoin: Object,
    value: {
      type: [String, Number],
      default: ''
    }
  });
  
  const emit = defineEmits(['openModal', 'update:value']);
  
  function openModal() {
    emit('openModal');
  }
  </script>
