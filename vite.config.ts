import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  // Vercel serves the app from the domain root. Use VITE_BASE_PATH only for previews
  // deployed below a subpath.
  base: process.env.VITE_BASE_PATH || '/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server:{
    port: 4200,
  }


});
