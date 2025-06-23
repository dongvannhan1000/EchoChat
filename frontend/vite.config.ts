import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import {visualizer} from 'rollup-plugin-visualizer'
import { cspHeader } from "./src/utils/cspHeader";
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  
  plugins: [
    mkcert(),
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap'
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'http-vendor': ['axios'],
          'utils-vendor': ['lodash'],
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',  
    port: parseInt(process.env.PORT as any) || 4173, 
    strictPort: true,
    headers: cspHeader
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT as any) || 4173,
    strictPort: true,
    allowedHosts: ['echo-chat-cqg2.onrender.com'],
    headers: cspHeader
  },
})
