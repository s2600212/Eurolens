import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.resolve(__dirname, "src");

// Debug: prints during vite startup so you can verify the path
console.log("Vite alias @ ->", srcPath);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "@", replacement: srcPath },
    ],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://eurolens.onrender.com",
        changeOrigin: true,
      },
    },
  },
});