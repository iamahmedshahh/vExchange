<template>
    <div class="swap-field">
      <div class="input-group-swap">
        <div class="input-wrapper">
          <input 
            type="text" 
            :value="value"
            @input="handleInput"
            placeholder="0.0" 
          />
          <button v-if="max && label === 'Sell'" @click="setMaxAmount" class="max-button">MAX</button>
        </div>
        <button @click="openModal" class="coin-select">
          <img v-if="selectedCoin" :src="selectedCoin.logo" alt="Coin logo" class="coin-logo" />
          <span class="coin-name">{{ selectedCoin ? selectedCoin.name : 'Select token' }}</span>
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
    },
    max: {
      type: [String, Number],
      default: '0'
    }
  });
  
  const emit = defineEmits(['openModal', 'update:value']);
  
  function openModal() {
    emit('openModal');
  }

  function handleInput(event) {
    const value = event.target.value;
    // Only allow numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      emit('update:value', value);
    }
  }

  function setMaxAmount() {
    emit('update:value', props.max);
  }
  </script>

  <style scoped>
  .swap-field {
    margin: 10px 0;
    width: 100%;
    background: #f8f9fa;
    border-radius: 12px;
    padding: 12px;
  }

  .input-group-swap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    border-radius: 8px;
    padding: 8px 12px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 1.2em;
    font-weight: 500;
    outline: none;
    color: #333;
    min-width: 0;
  }

  input::placeholder {
    color: #bbb;
  }

  .max-button {
    background: #f0f0f0;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 0.75em;
    font-weight: 600;
    cursor: pointer;
    color: #666;
    transition: all 0.2s;
  }

  .max-button:hover {
    background: #e0e0e0;
    color: #333;
  }

  .coin-select {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: none;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    min-width: 140px;
  }

  .coin-select:hover {
    background: #f5f5f5;
  }

  .coin-logo {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }

  .coin-name {
    font-weight: 500;
    color: #333;
  }

  .coin-id {
    font-size: 0.75em;
    color: #666;
    margin-left: 4px;
  }
  </style>
