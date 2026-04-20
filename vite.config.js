import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // React demo app (popup)
        popup: resolve(__dirname, 'index.html'),
        // Extension pages
        background: resolve(__dirname, 'extension/background.js'),
        content: resolve(__dirname, 'extension/content.js'),
      },
      external: [
        '@mediapipe/pose',
        '@mediapipe/hands',
        '@mediapipe/selfie_segmentation',
      ],
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'content') return 'extension/content.js';
          if (chunk.name === 'background') return 'extension/background.js';
          if (chunk.name === 'monitoring') return 'extension/monitoring.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'extension/manifest.json', dest: 'extension' },
        { src: 'extension/popup.html', dest: 'extension' },
        { src: 'extension/popup.js', dest: 'extension' },
        { src: 'extension/monitoring.html', dest: 'extension' },
        { src: 'extension/monitoring.js', dest: 'extension' },
        { src: 'extension/lib', dest: 'extension' },
        { src: 'extension/icons', dest: 'extension' },
      ],
    }),
  ],
})