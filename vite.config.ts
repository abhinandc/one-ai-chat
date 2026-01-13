import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 4002,
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/index.css';
          }

          return 'assets/[name]-[hash][extname]';
        },
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Material Symbols React - explicit paths for subpath exports
      "@nine-thirty-five/material-symbols-react/outlined": path.resolve(
        __dirname,
        "node_modules/@nine-thirty-five/material-symbols-react/dist/esm/outlined/index.js"
      ),
      "@nine-thirty-five/material-symbols-react/rounded": path.resolve(
        __dirname,
        "node_modules/@nine-thirty-five/material-symbols-react/dist/esm/rounded/index.js"
      ),
    },
  },
  optimizeDeps: {
    include: [
      "@nine-thirty-five/material-symbols-react/outlined",
      "@nine-thirty-five/material-symbols-react/rounded",
    ],
  },
}));