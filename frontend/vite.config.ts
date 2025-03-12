import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true
  },
  server: {
    host: '0.0.0.0',  
    port: parseInt(process.env.PORT as any) || 4173, 
    strictPort: true, 
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT as any) || 4173,
    strictPort: true,
    allowedHosts: ['echo-chat-cqg2.onrender.com'], 
  },
})
