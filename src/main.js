import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router/index';
import { initializeStores } from './stores/initStore';

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize stores after pinia is installed
initializeStores()

app.mount('#app')
