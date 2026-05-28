// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "disable-vite-hmr-client",
      transformIndexHtml: {
        order: "post",
        handler(html) {
          return html.replace(
            /\s*<script type="module" src="\/@vite\/client"><\/script>/,
            ""
          );
        },
      },
    },
  ],
  server: {
    host: "localhost",
    port: 3000,
    strictPort: true,
    open: true,
    hmr: false,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
