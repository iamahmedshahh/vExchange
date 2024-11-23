<template>
  <div class="theme-buttons">
    <button 
      class="theme-button" 
      :class="{ active: currentTheme === 'light' }"
      @click="setTheme('light')"
    >
      <i class="fas fa-sun"></i>
      <span>Light</span>
    </button>
    <button 
      class="theme-button" 
      :class="{ active: currentTheme === 'dark' }"
      @click="setTheme('dark')"
    >
      <i class="fas fa-moon"></i>
      <span>Dark</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const currentTheme = ref('dark');

const setTheme = (theme) => {
  document.body.setAttribute("data-theme", theme);
  currentTheme.value = theme;
};

onMounted(() => {
  currentTheme.value = document.body.getAttribute("data-theme") || 'dark';
});
</script>

<style scoped>
.theme-buttons {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem;
}

.theme-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s;
  width: 100%;
}

.theme-button:hover {
  background: var(--hover-bg);
}

.theme-button.active {
  background: var(--hover-bg);
  color: var(--button-bg);
}

.theme-button i {
  font-size: 1rem;
}

.theme-button span {
  font-size: 0.875rem;
}
</style>