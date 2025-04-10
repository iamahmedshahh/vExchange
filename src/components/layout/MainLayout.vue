<template>
  <div class="main-layout">
    <Header />
    <main class="main-content">
      <slot></slot>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Header from './Header.vue';
import Footer from './Footer.vue';
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 24px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }
}
</style>
