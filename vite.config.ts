import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// `netlify dev` starts this server and proxies it on port 3102 (see netlify.toml),
// so /api/* requests reach the Netlify Functions instead of Vite.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
});
