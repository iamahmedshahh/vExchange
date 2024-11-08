<template>
  <div class="page-container">
  <header class="navbar">
    <NavBar />
  </header>
  <main class="main-content">
    <Swap />
  </main>
  <footer class="footer">
    <p>&copy; 2024 VerusSwap - All rights reserved.</p>
  </footer>
  </div>
</template>

<script setup>
import NavBar from './NavBar.vue';
import Swap from './Swap.vue';
</script>
