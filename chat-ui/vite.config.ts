import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'backend_api')

  return {
    plugins: [react()],
    define: {
      __BACKEND_API_BASE_URL__: JSON.stringify(env.backend_api ?? ''),
    },
  }
})
