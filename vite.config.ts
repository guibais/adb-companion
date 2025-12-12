import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: "electron/main/index.ts",
        onstart(args) {
          args.startup();
        },
        vite: {
          build: {
            outDir: "dist-electron/main",
            rollupOptions: {
              external: ["electron"],
            },
          },
        },
      },
      {
        entry: "electron/preload/index.ts",
        onstart(args) {
          args.reload();
        },
        vite: {
          build: {
            outDir: "dist-electron/preload",
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@electron": resolve(__dirname, "electron"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
