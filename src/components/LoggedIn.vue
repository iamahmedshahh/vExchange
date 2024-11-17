<template>
    <div>
      <h3>Logged In</h3>
      <div v-if="!loading">
        <p><b>Welcome:</b> {{ name }}</p>
        <p><b>Iaddress:</b> {{ iaddress }}</p>
      </div>
      <Loading v-if="loading" />
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import Loading from './Loading.vue';
  
  const loading = ref(true);
  const name = ref(localStorage.getItem('name'));
  const iaddress = ref(localStorage.getItem('iaddress'));
  
  onMounted(() => {
    if (name.value && iaddress.value) {
      loading.value = false;
    }
  });
  </script>
  