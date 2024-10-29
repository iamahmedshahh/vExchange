<template>
    <div class="swap-field">
      <label>{{ label }}</label>
      <div class="input-group-swap">
        <input type="text" placeholder="0" readonly />
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
  });
  const emit = defineEmits(['openModal']);
  
  function openModal() {
    emit('openModal');
  }
  </script>
  
  