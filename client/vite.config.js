import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (id.includes("react-router")) return "router";
          if (id.includes("@reduxjs") || id.includes("react-redux")) return "state";
          if (id.includes("@mui")) return "mui";
          if (id.includes("axios") || id.includes("socket.io-client")) return "network";
          return "vendor";
        }
      }
    }
  }
})
