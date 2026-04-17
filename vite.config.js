import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    minify: 'terser',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue'],
          router: ['vue-router'],
          store: ['pinia']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})