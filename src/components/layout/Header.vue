<template>
  <header class="app-header">
    <div class="header-container">
      <div class="logo-container">
        <router-link to="/" class="logo">
          <span class="logo-text">Verus<span class="accent">Swap</span></span>
        </router-link>
      </div>
      
      <div class="nav-links">
        <router-link to="/" class="nav-link" active-class="active" exact>Swap</router-link>
        <router-link to="/wallet" class="nav-link" active-class="active">Wallet</router-link>
        <router-link to="/pools" class="nav-link coming-soon" active-class="active">
          Pools
          <span class="coming-soon-badge">Soon</span>
        </router-link>
        <router-link to="/nft" class="nav-link coming-soon" active-class="active">
          NFT
          <span class="coming-soon-badge">Soon</span>
        </router-link>
      </div>
      
      <div class="header-actions">
        <button 
          v-if="network?.isTestnet" 
          class="network-badge"
        >
          Testnet
        </button>
        
        <button 
          class="theme-toggle" 
          @click="toggleTheme"
          aria-label="Toggle theme"
        >
          <div class="toggle-track">
            <div class="toggle-thumb" :class="{ 'active': !isDarkTheme }"></div>
            <div class="toggle-icons">
              <svg v-if="isDarkTheme" class="moon-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              <svg v-else class="sun-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            </div>
          </div>
        </button>
        
        <WalletButton />
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useVerusWallet } from '../../hooks/useVerusWallet';
import WalletButton from '../wallet/WalletButton.vue';

const { network } = useVerusWallet();

const isDarkTheme = ref(true);

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
  document.documentElement.setAttribute('data-theme', isDarkTheme.value ? 'dark' : 'light');
  localStorage.setItem('theme', isDarkTheme.value ? 'dark' : 'light');
};

onMounted(() => {
  // Check saved theme or system preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    isDarkTheme.value = savedTheme === 'dark';
  } else {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDarkTheme.value = prefersDark;
  }
  
  // Apply theme
  document.documentElement.setAttribute('data-theme', isDarkTheme.value ? 'dark' : 'light');
});
</script>

<style scoped>
.app-header {
  width: 100%;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-header);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo {
  text-decoration: none;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
}

.logo-text {
  background: linear-gradient(to right, var(--text-primary), var(--primary-color));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.accent {
  color: var(--primary-color);
}

.nav-links {
  display: flex;
  gap: 16px;
  margin-left: 40px;
}

.nav-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: var(--text-primary);
  background-color: var(--bg-hover);
}

.nav-link.active {
  color: var(--primary-color);
  background-color: var(--primary-color-light);
}

.coming-soon {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
}

.coming-soon-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  background: linear-gradient(90deg, var(--primary-color), #9333ea);
  color: white;
  border-radius: 10px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.7;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.network-badge {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 600;
}

.theme-toggle {
  background-color: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: all 0.2s ease;
}

.toggle-track {
  width: 50px;
  height: 24px;
  background-color: var(--bg-hover);
  border-radius: 30px;
  position: relative;
  padding: 2px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
}

.toggle-thumb {
  position: absolute;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: var(--primary-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  z-index: 2;
}

.toggle-thumb.active {
  transform: translateX(26px);
}

.toggle-icons {
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 6px;
  position: relative;
  z-index: 1;
}

.moon-icon {
  color: #f1c40f;
}

.sun-icon {
  color: #f39c12;
}

.theme-toggle:hover .toggle-track {
  background-color: var(--primary-color-light);
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
  
  .header-container {
    padding: 0 16px;
  }
}
</style>
