<template>
    <div class="transaction-history">
      <h3>Transaction History</h3>
      <ul>
        <li v-for="(item, index) in history" :key="index">
          <span>{{ item.type }}:</span> <strong>{{ item.amount }} VERUS</strong> <em>{{ item.date }}</em>
        </li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const history = ref([
    { type: 'Swap', amount: 10, date: '2024-01-01' },
    { type: 'Add Liquidity', amount: 50, date: '2024-02-10' },
  ])
  </script>
  
