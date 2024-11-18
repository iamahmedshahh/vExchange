<template>
  <div class="page-container">
  <header class="navbar">
    <NavBar @toggle-modal="showModal = !showModal" />
  </header>
  <main class="main-content">
    <!-- Only show Swap on the homepage -->
    <template v-if="$route.path === '/'">
        <Swap />
      </template>
      <router-view></router-view>

  <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <QrLogin @close="showModal = false"/>
  </div>
  </main>
  <footer class="footer">
    <p>&copy; 2024 VerusSwap - All rights reserved.</p>
  </footer>
  </div>
</template>

<script setup>
import NavBar from './NavBar.vue';
import Swap from './Swap.vue';
import QrLogin from './QrLogin.vue';
import { ref } from 'vue';

const showModal = ref(false);

</script>

