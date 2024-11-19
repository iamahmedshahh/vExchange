// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import WalletPage from '../components/WalletPage.vue';
import Swap from '../components/Swap.vue'
import LoggedIn from '../components/LoggedIn.vue'

const routes = [
  {
    path: '/wallet',
    name: 'Wallet',
    component: WalletPage,
  },
  {
    path: '/',
    name: 'Swap',
    component: Swap,
  },
  {
    path: '/loggedin',
    name: 'Logged In',
    component: LoggedIn,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
