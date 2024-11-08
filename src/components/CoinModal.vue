<template>
    <div class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div v-if="loading">Loading...</div>
        <ul v-else class="m-ul">
          <li v-for="coin in coinList" :key="coin.name" @click="selectCoin(coin)" class="m-li">
            <img :src="coin.logo" alt="Coin logo" class="coin-logo" /> {{ coin.name }}
          </li>
        </ul>
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  
  const props = defineProps({
    loading: Boolean,
    coinList: Array,
  });
  const emit = defineEmits(['selectCoin', 'closeModal']);
  
  function selectCoin(coin) {
    emit('selectCoin', coin);
  }
  
  function closeModal() {
    emit('closeModal');
  }
  </script>
  

  