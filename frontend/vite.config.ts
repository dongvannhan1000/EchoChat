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
    port: parseInt(process.env.PORT as string) || 4173, // Render sẽ cấp cổng tự động
  },
})
