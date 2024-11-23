import { useUserStore } from './userStore';

export function initializeStores() {
  const userStore = useUserStore();
  
  // Check if user is logged in by verifying localStorage items
  const name = localStorage.getItem('name');
  const token = localStorage.getItem('token');
  
  if (name && token) {
    userStore.setLoginStatus(true);
    userStore.setVerusId(name);
  }
}
