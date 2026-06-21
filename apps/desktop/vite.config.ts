import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "motion"],
    alias: {
      "@": path.resolve(rootDir, "../../src"),
      "next/link": path.resolve(rootDir, "src/shims/next-link.tsx"),
      "next/navigation": path.resolve(rootDir, "src/shims/next-navigation.tsx"),
      "next-auth/react": path.resolve(rootDir, "src/shims/next-auth-react.tsx"),
      react: path.resolve(rootDir, "node_modules/react"),
      "react-dom": path.resolve(rootDir, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(rootDir, "node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(rootDir, "node_modules/react/jsx-dev-runtime"),
      motion: path.resolve(rootDir, "node_modules/motion"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
  },
  server: {
    port: 1420,
    strictPort: true,
  },
});
