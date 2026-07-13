import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const BACKEND = env.VITE_DEV_PROXY_TARGET || 'https://panacea-produccion-backend.vercel.app'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/auth': {
          target: BACKEND,
          changeOrigin: true,
        },
        '/costos': {
          target: BACKEND,
          changeOrigin: true,
        },
        '/profile': {
          target: BACKEND,
          changeOrigin: true,
        },
      },
    },
  }
})
