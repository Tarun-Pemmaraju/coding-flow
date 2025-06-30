import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/python': {
        target: 'http://localhost:5000', // Change to your backend server port
        changeOrigin: true,
        secure: false,
        ws: true, // Enable websocket proxying
        rewrite: (path) => path.replace(/^\/python/, ''), // Strip /python prefix if backend doesn't expect it
      },
    },
    logLevel: 'debug', // Add debug logging for proxy
  },
})
