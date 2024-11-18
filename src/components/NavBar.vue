<template>
  <nav class="navbar">
    <!-- Left Column: Logo -->
    <h1 class="navbar-logo">vExchange</h1>
    
    <!-- Center Column: Search Bar -->
    <div class="navbar-search">
      <input type="text" placeholder="Search..." class="search-input" />
    </div>

    <!-- Right Column: Connect Wallet & Theme Switcher -->
    <div class="navbar-actions">
      <button @click="$emit('toggle-modal')" class="button-56">Connect Verus ID</button>
      <button v-if="!walletAddress" @click="connectMetaMask" class="button-56">
        Connect MetaMask
      </button>
      <div v-else>
        <!-- Wallet Address with Dropdown -->
<!-- Wallet Address with Copy and Logout Icons -->
<div class="wallet-address">
  <i class="fa fa-copy" :class="{ 'copied': isCopied }" @click.left="copyToClipboard">
    {{ formattedAddress }}
    </i>
  <i class="fa fa-sign-out-alt" @click="logout" style="margin-left: 10px; cursor: pointer;" />
</div>

        <!-- Dropdown Menu for Logout -->
        <div v-if="showWalletDropdown" class="dropdown-menu">
          <button @click="logout" class="dropdown-item">Logout</button>
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
import { ref, computed, onMounted } from 'vue';  // Import computed
import MetaMaskService from '../scripts/metaMaskLogin'; // Import MetaMaskService
import ThemeSwitcher from './ThemeSwitcher.vue';

const walletAddress = ref(null);
const metaMaskService = new MetaMaskService();
const showWalletDropdown = ref(false); // For the wallet dropdown
const showSettingsDropdown = ref(false);
const isCopied = ref(false);

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

// Format wallet address (show first 5 and last 5 characters)
const formattedAddress = computed(() => {
  if (!walletAddress.value) return '';
  const address = walletAddress.value;
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
});

// Toggle wallet dropdown visibility
const toggleWalletDropdown = () => {
  showWalletDropdown.value = !showWalletDropdown.value;
  showSettingsDropdown.value = false; // Close settings dropdown when opening wallet dropdown
};

// Toggle settings dropdown visibility
const toggleSettingsDropdown = () => {
  showSettingsDropdown.value = !showSettingsDropdown.value;
  showWalletDropdown.value = false; // Close wallet dropdown when opening settings dropdown
};


const copyToClipboard = async () => {
  if (walletAddress.value) {
    try {
      await navigator.clipboard.writeText(walletAddress.value);
      isCopied.value = true;
      setTimeout(() => {
        isCopied.value = false; // Reset icon color after a delay
      }, 700); // Adjust the delay as needed
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  }
};

// Logout MetaMask
const logout = () => {
  walletAddress.value = null;
  showWalletDropdown.value = false; // Close wallet dropdown on logout
  localStorage.removeItem('walletAddress'); // Clear from localStorage
};
</script>

<style scoped>
.wallet-address {
  display: flex;
  align-items: center;
  cursor: pointer;
}
.wallet-address .fa-copy.copied {
  color: green; /* Set the color to indicate successful copy */
}

.copy-icon {
  margin-left: 10px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.copied-icon {
  color: #4caf50; /* Change to green or any color you prefer */
}

.dropdown-container {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.dropdown-toggle {
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  color: white;
  border-radius: 4px;
  margin-top: 8px;
  min-width: 150px;
  padding: 10px;
  z-index: 1000;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  border: none;
  background: none;
  text-align: left;
  width: 100%;
  color: white;
}

.dropdown-item:hover {
  background-color: #414141;
}
</style>
