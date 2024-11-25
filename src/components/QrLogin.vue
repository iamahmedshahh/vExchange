<template>
  <div class="modal">
    <h3>Sign In</h3>
    <div v-if="loading">
      <Loading />
    </div>
    <div v-else>
      <div v-if="showLoginQR && QRData">
        <img :src="qrCodeUrl" alt="QR Code" />
        <p>Please scan the QR code with your Verus Mobile app.</p>
      </div>
      <div v-else>
        <button @click="handleLogin" class="button-56">Login with your ID</button>
      </div>
      <div>
       <p>Get <a href="#">Verus Wallet</a></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { login } from '../scripts/login';
import Loading from './Loading.vue';
import QRCode from 'qrcode';
import { useUserStore } from '../stores/userStore';

const userStore = useUserStore();
const showLoginQR = ref(false);
const QRData = ref(null);
const qrCodeUrl = ref('');
const loading = ref(false);
const challengeID = ref(null);

const generateQRCode = async (data) => {
  try {
    qrCodeUrl.value = await QRCode.toDataURL(data, { width: 400 });
  } catch (error) {
    console.error('QR Code generation failed:', error);
  }
};

const handleLogin = async () => {
  try {
    loading.value = true;
    const reply = await login();

    if (reply?.success) {
      console.log(reply.data.deepLink);
      showLoginQR.value = true;
      QRData.value = reply.data.deepLink;
      challengeID.value = reply.data.challengeID;
      loading.value = false;

      generateQRCode(QRData.value);

      const socket = new WebSocket(`${import.meta.env.VITE_WS_SERVER}/awaitlogin/${challengeID.value}`);
      socket.onopen = () => console.log("WebSocket connection established");

      socket.onmessage = (event) => {
        const receivedMessage = JSON.parse(event.data);
        localStorage.setItem("token", JSON.stringify(receivedMessage.JWT));
        localStorage.setItem("iaddress", receivedMessage.iaddress);
        localStorage.setItem("name", receivedMessage.name);
        
        // Update the Pinia store
        userStore.setLoginStatus(true);
        userStore.setVerusId(receivedMessage.name);
        
        window.location.assign("/");
      };

      socket.onerror = (error) => console.error("WebSocket Error:", error);
      socket.onclose = () => console.log("WebSocket connection closed");
    } else {
      loading.value = false;
    }
  } catch (error) {
    console.error(error);
    loading.value = false;
  }
};
</script>
