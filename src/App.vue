<template>
    <Home/>
</template>

<script setup>
import { onMounted } from 'vue';
import Home from './components/Home.vue'
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
</script>

