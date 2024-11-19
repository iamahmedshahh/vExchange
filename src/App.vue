<template>
  <div class="page-container">
  <header class="navbar">
    <NavBar @toggle-modal="showModal = !showModal" />
  </header>
  <main class="main-content">
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
import NavBar from './components/NavBar.vue';
import Swap from './components/Swap.vue';
import QrLogin from './components/QrLogin.vue';
import { ref, onMounted} from 'vue';
import {listCurrencies} from './scripts/verusRpcInit'

onMounted(async () => {
  try {
    // Call your function, for example:
    const result = await listCurrencies();
    console.log(result);
  } catch (error) {
    console.error('Error:', error);
  }
});

const showModal = ref(false);

</script>


