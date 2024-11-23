import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    isLoggedIn: false,
    verusId: null,
  }),
  
  actions: {
    setLoginStatus(status) {
      this.isLoggedIn = status;
    },
    
    setVerusId(id) {
      this.verusId = id;
    },
    
    logout() {
      this.isLoggedIn = false;
      this.verusId = null;
    }
  },
  
  getters: {
    getVerusId: (state) => state.verusId,
    getLoginStatus: (state) => state.isLoggedIn,
  }
});
