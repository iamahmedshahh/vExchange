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
      <button class="button-56" role="button" @click="showModal = true">Connect Wallet</button>
      <ThemeSwitcher />
    </div>
</nav>

  <div v-if="showModal" class="modal" @click.self="showModal = false">
      <div class="modal-content">
        <QrLogin @close="showModal = false"/>
      </div>
  </div>

</template>

<script setup>
import ThemeSwitcher from './ThemeSwitcher.vue';
import QrLogin from './QrLogin.vue';
import { ref } from 'vue';

const showModal = ref(false);
const responseLog = ref(null);
</script>
<style scoped>
/* Style your modal to center within the content section */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 400px; /* Adjust width as needed */
  max-width: 90%;
  position: relative;
  transform: translateY(-50%);
  top: 50%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

</style>