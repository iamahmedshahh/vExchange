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
    cors: {
      origin: ['https://wasp-loved-alien.ngrok-free.app', 'ws://localhost:3000'], // or specify allowed origins
      methods: ['GET', 'POST', 'PUT', 'DELETE'], // allowed methods
      credentials: true,
    }
  }
  },
);
