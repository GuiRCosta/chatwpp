import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    port: 7564,
    proxy: {
      "/api": {
        target: "http://localhost:7563",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, "")
      },
      "/public": {
        target: "http://localhost:7563",
        changeOrigin: true
      },
      "/socket.io": {
        target: "http://localhost:7563",
        ws: true
      }
    }
  }
})
