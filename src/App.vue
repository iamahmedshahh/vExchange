<template>
  <div class="page-container">
  <header class="navbar">
    <NavBar @toggle-modal="showModal = !showModal" />
  </header>
  <main class="main-content">
  <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <QrLogin @close="showModal = false"/>
  </div>
  <div v-else>
    <Swap></Swap>
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
import {listCurrencies} from './scripts/verusRpcInit';
import { useAuthStore } from './stores/authStore';

const authStore = useAuthStore();
const showModal = ref(false);

onMounted(async () => {
  // Initialize auth store
  authStore.init();
  
  try {
    const result = await listCurrencies();
    console.log(result);
  } catch (error) {
    console.error('Error:', error);
  }
});

</script>
