// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { nodePolyfills } from 'vite-plugin-node-polyfills'



export default defineConfig({
  plugins: [
    vue(),
    nodePolyfills({ include: ['fs', 'stream', 'buffer', 'crypto'] })
    
  ],
  server: {
    proxy: {
      '/verusidlogin': 'http://localhost:3001', // Proxy requests to your Express server
    },
  },
  },
);
