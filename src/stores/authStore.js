import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const iaddress = ref(null)

  function login(address) {
    isLoggedIn.value = true
    iaddress.value = address
    localStorage.setItem('iaddress', address)
  }

  function logout() {
    isLoggedIn.value = false
    iaddress.value = null
    localStorage.removeItem('iaddress')
  }

  // Initialize state from localStorage
  function init() {
    const savedAddress = localStorage.getItem('iaddress')
    if (savedAddress) {
      login(savedAddress)
    }
  }

  return {
    isLoggedIn,
    iaddress,
    login,
    logout,
    init
  }
})
