<template>
  <div>
    <h1>Login with Verus ID</h1>
    <div v-if="loading">Loading QR Code...</div>
    <div v-else-if="qrCodeUrl">
      <p>Scan this QR code:</p>
      <img :src="qrCodeUrl" alt="Login QR Code" />
    </div>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { generateLogin } from '../scripts/verusIdLogin';

const deepLink = ref('');
const qrCodeUrl = ref('');
const error = ref(null);
const loading = ref(true);

async function generateLoginHandler() {
  error.value = null;
  loading.value = true; // Set loading to true at the start
  try {
    const { deepLink: link, qrCodeUrl: qrUrl } = await generateLogin(
      import.meta.env.VITE_SIGNING_IADDRESS,
      import.meta.env.VITE_PRIVATE_KEY,
      import.meta.env.VITE_CHAIN_IADDRESS
    );
    deepLink.value = link;
    qrCodeUrl.value = qrUrl;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false; // Set loading to false after completion
  }
}

// Call the function as soon as the component is mounted
onMounted(generateLoginHandler);
</script>
