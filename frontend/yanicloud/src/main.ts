// Добавь эту строчку в src/main.ts

import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Styles
import 'unfonts.css'
import '@/styles/motion.scss'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
