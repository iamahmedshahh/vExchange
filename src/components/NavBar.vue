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
        <div @click="toggleDropdown" class="wallet-address">
          {{ formattedAddress }}
          <span class="copy-icon" @click.right="copyToClipboard">
          </span>
        </div>
        <!-- Dropdown Menu for Logout -->
        <div v-if="showDropdown" class="dropdown-menu">
          <button @click="logout" class="dropdown-item">Logout</button>
        </div>
      </div>
      <ThemeSwitcher />
    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue';  // Import computed
import MetaMaskService from '../scripts/metaMaskLogin'; // Import MetaMaskService
import ThemeSwitcher from './ThemeSwitcher.vue';

const walletAddress = ref(null);
const metaMaskService = new MetaMaskService();
const showDropdown = ref(false); // To control the dropdown visibility

// Connect MetaMask
const connectMetaMask = async () => {
  walletAddress.value = await metaMaskService.connect();
};

// Format wallet address (show first 5 and last 5 characters)
const formattedAddress = computed(() => {
  if (!walletAddress.value) return '';
  const address = walletAddress.value;
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
});

// Toggle dropdown visibility
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

// Copy wallet address to clipboard
const copyToClipboard = async () => {
  if (walletAddress.value) {
    try {
      await navigator.clipboard.writeText(walletAddress.value);
      alert('Address copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  }
};

// Logout MetaMask
const logout = () => {
  walletAddress.value = null;  // Clear wallet address
  showDropdown.value = false; // Close dropdown
};
</script>

<style scoped>
.wallet-address {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.copy-icon {
  margin-left: 10px;
  cursor: pointer;
}

.copy-icon i {
  font-size: 16px;
}

.dropdown-menu {
  position: absolute;
  background-color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  margin-top: 10px;
  padding: 5px 10px;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
}

.dropdown-item:hover {
  background-color: #f1f1f1;
}

/* Optional: Style for the wallet address */
.wallet-address {
  position: relative;
  display: inline-block;
}
</style>
