// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import WalletPage from '../components/WalletPage.vue';

const routes = [
  {
    path: '/wallet',
    name: 'Wallet',
    component: WalletPage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
