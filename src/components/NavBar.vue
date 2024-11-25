<template>
  <nav class="navbar">
    <!-- Left Column: Logo -->
    <h1 class="navbar-logo" @click="">vExchange</h1>

    <!-- Center Column: Search Bar -->
    <div class="navbar-search">
      <input type="text" placeholder="Search..." class="search-input" />
    </div>

    <!-- Right Column: Connect Wallet & Theme Switcher -->
    <div class="navbar-actions">
      <div v-if="verusName" class="user-dropdown">
        <div @click="toggleUserDropdown" class="user-menu-toggle">
          <span class="username">{{ verusName }}</span>
          <i class="fas fa-chevron-down"></i>
        </div>
        <div v-if="showUserDropdown" class="dropdown-menu user-menu">
          <div class="dropdown-item" @click="logoutv">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </div>
        </div>
      </div>
      <button v-else @click="$emit('toggle-modal')" class="button-56">Connect Verus ID</button>

      <button v-if="!walletAddress" @click="connectMetaMask" class="button-56">
        Connect MetaMask
      </button>
      <div v-else>
        <!-- Wallet Address with Copy and Logout Icons -->
        <div class="wallet-address">
          <i class="fa fa-copy" :class="{ 'copied': isCopied }" @click.left="copyToClipboard">
            {{ formattedAddress }}
          </i>
          <i class="fa fa-sign-out-alt" @click="logout" style="margin-left: 10px; cursor: pointer;" />
        </div>
      </div>

      <div class="dropdown-container">
        <div @click="toggleSettingsDropdown" class="dropdown-toggle">
          <i class="fas fa-cog" style="font-size: 20px; cursor: pointer;"></i>
        </div>
        <div v-if="showSettingsDropdown" class="dropdown-menu">
          <ThemeSwitcher class="dropdown-item"> <span>Theme</span> </ThemeSwitcher>
          <router-link to="/wallet" class="button-56">Wallet</router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import MetaMaskService from '../scripts/metaMaskLogin';
import ThemeSwitcher from './ThemeSwitcher.vue';
import { useAuthStore } from '../stores/authStore';

const walletAddress = ref(null);
const metaMaskService = new MetaMaskService();
const showWalletDropdown = ref(false);
const showUserDropdown = ref(false);
const showSettingsDropdown = ref(false);
const isCopied = ref(false);
const verusName = ref(localStorage.getItem('name'));
const authStore = useAuthStore();

onMounted(() => {
  const storedAddress = localStorage.getItem('walletAddress');
  if (storedAddress) {
    walletAddress.value = storedAddress;
  }
});

// Connect MetaMask
const connectMetaMask = async () => {
  const address = await metaMaskService.connect();
  walletAddress.value = address;
  localStorage.setItem('walletAddress', address); // Store in localStorage
};

// Format wallet address
const formattedAddress = computed(() => {
  if (!walletAddress.value) return '';
  const address = walletAddress.value;
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
});

// Toggle settings dropdown visibility
const toggleSettingsDropdown = () => {
  showSettingsDropdown.value = !showSettingsDropdown.value;
  showWalletDropdown.value = false;
};

// Toggle user dropdown
const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value;
  if (showUserDropdown.value) {
    showSettingsDropdown.value = false;
  }
};

// Copy wallet address to clipboard
const copyToClipboard = async () => {
  if (walletAddress.value) {
    try {
      await navigator.clipboard.writeText(walletAddress.value);
      isCopied.value = true;
      setTimeout(() => {
        isCopied.value = false;
      }, 700);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  }
};

// Logout MetaMask
const logout = () => {
  walletAddress.value = null;
  showWalletDropdown.value = false;
  localStorage.removeItem('walletAddress');
};

const logoutv = () => {
  verusName.value = null;
  localStorage.removeItem('name');
  authStore.logout();
};
</script>

<style scoped>
.user-dropdown {
  position: relative;
  display: inline-block;
}

.user-menu-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
}

.user-menu-toggle:hover {
  background: var(--hover-bg);
}

.username {
  font-weight: 500;
}

.user-menu {
  min-width: 150px;
  right: 0;
  top: 100%;
  margin-top: 0.5rem;
}

.dropdown-menu {
  position: absolute;
  background: var(--card-bg);
  border: 1px solid var(--input-border-color);
  border-radius: 0.5rem;
  padding: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 1000;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background: var(--hover-bg);
}

/* Your existing styles */
</style>
