import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") }
  },
  base: "/",
  build: { emptyOutDir: true, sourcemap: true },
  server: { port: 5173, open: true }
});
