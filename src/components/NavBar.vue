<template>
  <nav class="navbar">
    <!-- Left Column: Logo -->
    <h1 class="navbar-logo">vExchange</h1>
    
    <!-- Center Column: Search Bar -->
    <div class="navbar-search">
      <input type="text" placeholder="Search..." class="search-input" />
    </div>

    <!-- Right Column: Connect Wallet & Theme Switcher -->
    <div class="navbar-actions">
      <button @click="$emit('toggle-modal')" class="button-56">Connect Verus ID</button>
      <button class="button-56">Connect MetaMask</button>
      <ThemeSwitcher />
    </div>
</nav>


</template>

<script setup>
import ThemeSwitcher from './ThemeSwitcher.vue';
import QrLogin from './QrLogin.vue';
import { ref } from 'vue';

const responseLog = ref(null);
</script>
