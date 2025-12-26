import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        widget: path.resolve(__dirname, 'src/widget/index.tsx')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'widget' ? 'widget.js' : 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'widget.css') return 'widget.css';
          return 'assets/[name]-[hash][extname]';
        },
        // Aggressively prevent chunking - inline everything into widget
        manualChunks: (id) => {
          // Only chunk node_modules for main app, not for widget
          if (id.includes('node_modules')) {
            // Check if this is imported by widget
            // If widget uses it, don't chunk it
            return 'vendor';
          }
          // Everything else goes into the entry file
          return undefined;
        }
      },
      // Don't preserve entry signatures to allow better tree-shaking and inlining
      preserveEntrySignatures: false
    }
  }
}))
