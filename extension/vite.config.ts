import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import { resolve } from "path";
import manifest from "./manifest.json";

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, __dirname, "");
  const defaultApiUrl = mode === "development"
    ? "http://localhost:3000"
    : "https://repomind.vercel.app";
  const apiUrl = (environment.VITE_API_BASE_URL || defaultApiUrl).replace(/\/$/, "");
  const apiOrigin = new URL(apiUrl).origin;
  const configuredManifest = {
    ...manifest,
    name: mode === "development"
      ? "RepoMind — Local Development"
      : manifest.name,
    short_name: mode === "development" ? "RepoMind Dev" : manifest.short_name,
    host_permissions: ["https://github.com/*", `${apiOrigin}/*`],
    action: {
      ...manifest.action,
      default_title: mode === "development"
        ? "RepoMind local development — localhost:3000"
        : manifest.action.default_title,
    },
  };

  return {
    plugins: [react(), crx({ manifest: configuredManifest })],
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(apiUrl),
    },
    resolve: {
      alias: {
        "@": resolve(__dirname),
        "@panel": resolve(__dirname, "panel/src"),
        "@background": resolve(__dirname, "background"),
        "@content": resolve(__dirname, "content"),
      },
    },
    build: {
      outDir: mode === "development" ? "dist-dev" : "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          panel: resolve(__dirname, "panel/index.html"),
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5173,
      },
    },
  };
});
