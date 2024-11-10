<template>
  <div>
    <h1>Login with Verus ID</h1>
    <div v-if="loading">Loading QR Code...</div>
    <div v-else-if="qrCodeUrl">
      <p>Scan this QR code:</p>
      <img :src="qrCodeUrl" alt="Login QR Code" />
      <p v-if="username">Logged in as: {{ username }}</p>
      <button v-if="username" @click="logout">Logout</button> <!-- Logout Button -->
    </div>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { generateLogin } from '../scripts/verusIdLogin';

const qrCodeUrl = ref('');
const error = ref(null);
const loading = ref(true);
const username = ref(''); // Store the username

async function generateLoginHandler() {
  error.value = null;
  loading.value = true;
  try {
    const { qrCodeUrl: qrUrl, username: user } = await generateLogin();

    // Set the QR code URL and username
    qrCodeUrl.value = qrUrl;
    username.value = user; // Set the username directly

    if (username.value) {
      loading.value = false;  // Hide the loading state when logged in
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    // Ensure loading is set to false after the process ends, regardless of success/failure
    if (!username.value) {
      loading.value = false;
    }
  }
}

function logout() {
  username.value = ''; // Clear the username
  qrCodeUrl.value = ''; // Clear the QR code URL
  loading.value = true; // Reset loading state
  generateLoginHandler(); // Optionally re-trigger the login process if needed
}

onMounted(generateLoginHandler);
</script>
