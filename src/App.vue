<template>
  <MainLayout>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </MainLayout>
</template>

<script setup>
import MainLayout from './components/layout/MainLayout.vue';
import { onMounted } from 'vue';
import { useVerusWallet } from './hooks/useVerusWallet';

const { checkExtension } = useVerusWallet();

onMounted(async () => {
  // Check if Verus extension is installed and available
  await checkExtension();
});
</script>

<style>
/* Import global variables */
@import './assets/css/variables.css';
</style>
