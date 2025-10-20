import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") }
  },
  // Use web-friendly base; the old "./" was only for Electron file://
  base: "/",
  build: { emptyOutDir: true, sourcemap: true },
  server: { port: 5173, open: true }
});
