// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Wallet from '../views/Wallet.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/wallet',
    name: 'Wallet',
    component: Wallet,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
