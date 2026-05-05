import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-static',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist')
        const swSrc = resolve(__dirname, 'service-worker.js')
        const swDst = resolve(distDir, 'service-worker.js')
        const manifestSrc = resolve(__dirname, 'manifest.json')
        const manifestDst = resolve(distDir, 'manifest.json')
        const iconsDir = resolve(distDir, 'icons')

        if (existsSync(swSrc)) copyFileSync(swSrc, swDst)
        if (existsSync(manifestSrc)) copyFileSync(manifestSrc, manifestDst)

        if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true })
        const iconSizes = ['72x72', '96x96', '128x128', '144x144', '152x152', '192x192', '384x384', '512x512']
        iconSizes.forEach(size => {
          const iconSrc = resolve(__dirname, `icons/icon-${size}.png`)
          if (existsSync(iconSrc)) {
            copyFileSync(iconSrc, resolve(iconsDir, `icon-${size}.png`))
          }
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
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
