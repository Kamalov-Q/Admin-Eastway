import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }
  },
  base: "./",            // <-- critical for file:// loads in Electron
  build: { emptyOutDir: true, sourcemap: true },
  server: { port: 5173, open: true }
});
