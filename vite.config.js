import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: "./src/application/index.jsx",
      output: {
          entryFileNames: "bundle.js",
          assetFileNames: "[name].[ext]"
      }
    }
  }
});
