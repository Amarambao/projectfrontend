import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import {fileURLToPath, URL} from 'node:url'

export default defineConfig({
    plugins: [
        vue(),
        process.env.NODE_ENV === 'development' ? vueDevTools() : null
    ].filter(Boolean),
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
    },
})
