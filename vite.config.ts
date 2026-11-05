import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.API_PROXY_TARGET || 'http://localhost:8000'
  return {
    plugins: [vue(), tailwindcss(), vueDevTools()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      port: 5173,
      strictPort: true,
      watch: { usePolling: env.VITE_USE_POLLING === 'true' },
      proxy: Object.fromEntries(
        ['/api', '/sanctum'].map((path) => [path, { target, changeOrigin: true }]),
      ),
    },
  }
})
