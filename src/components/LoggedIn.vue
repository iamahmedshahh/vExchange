<template>
  <div>
    <h3>Logged In</h3>
    <div v-if="!loading">
      <p><b>Welcome:</b> {{ name }}</p>
      <p><b>Iaddress:</b> {{ iaddress }}</p>
      <p><b>Balance:</b> {{ balanceForUser }}</p>
      <button @click="logout" class="logout-button">Log Out</button>
    </div>
    <Loading v-if="loading" />
  </div>
  <router-view></router-view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Loading from './Loading.vue';
import { useVerusWallet } from '../hooks/useVerusWallet';

const loading = ref(true);
const name = ref(localStorage.getItem('name'));
const iaddress = ref(localStorage.getItem('iaddress'));
const balanceForUser = ref(null);
const { getBalance } = useVerusWallet();

onMounted(async () => {
  if (name.value && iaddress.value) {
    try {
      const balance = await getBalance('VRSC');
      console.log('VRSC balance:', balance);
      
      if (balance !== undefined) {
        const balanceInVRSC = balance / 100000000;
        balanceForUser.value = `${balanceInVRSC.toFixed(8)} VRSC`;
      } else {
        balanceForUser.value = "0.00000000 VRSC";
      }
      loading.value = false;
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      balanceForUser.value = "Error fetching balance";
      loading.value = false;
    }
  }
});

const logout = () => {
  localStorage.removeItem('iaddress');
  localStorage.removeItem('name');
  localStorage.removeItem('token');
  name.value = null;
  iaddress.value = null;
  loading.value = true;
  window.location.assign('/');
};
</script>

<style scoped>
.logout-button {
  margin-top: 10px;
  background: #dc3545;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.logout-button:hover {
  background: #c82333;
}
</style>
