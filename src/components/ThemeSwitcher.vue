<template>
    <div class="theme-switcher">
      <label class="switch">
        <input type="checkbox" @change="toggleTheme" />
        <span class="slider"></span>
      </label>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const toggleTheme = () => {
  const currentTheme = document.body.getAttribute("data-theme");
  document.body.setAttribute("data-theme", currentTheme === "light" ? "dark" : "light");
};

  </script>