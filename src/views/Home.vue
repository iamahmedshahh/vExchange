<template>
  <div class="home-container">
    <div class="hero-section">
      <h1 class="headline">Swap Crypto <span class="accent">Seamlessly</span> with Verus</h1>
      <p class="subheadline">Fast, secure and decentralized swaps on the Verus blockchain</p>
    </div>
    
    <div class="swap-section">
      <SwapContainer />
    </div>
  </div>
</template>

<script setup>
import SwapContainer from '../components/swap/SwapContainer.vue';
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-out;
}

.hero-section {
  text-align: center;
  margin-bottom: 40px;
}

.headline {
  font-size: 42px;
  font-weight: 800;
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.accent {
  color: var(--primary-color);
}

.subheadline {
  font-size: 18px;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.swap-section {
  width: 100%;
  max-width: 480px;
  animation: slideUp 0.5s ease-out;
}

@media (max-width: 768px) {
  .home-container {
    padding: 20px 16px;
  }
  
  .headline {
    font-size: 32px;
  }
  
  .subheadline {
    font-size: 16px;
  }
}
</style>
