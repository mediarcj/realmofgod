/**
 * File: apps/sanctuary/vite.config.ts
 * Description: Configures the local Vite build for the isolated sanctuary and Worker package.
 * Purpose: Keeps development loopback-only, local-binding-only, and source-map-free.
 * Notes: Deployment commands and remote provider bindings are intentionally absent.
 */

// Import only the official React and Cloudflare integrations plus Vite's typed helper.
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Disable telemetry, error reporting, default log files, remote metadata, and ambient env loading.
const localWorkerToolEnvironment = {
  CLOUDFLARE_CF_FETCH_ENABLED: "false",
  CLOUDFLARE_INCLUDE_PROCESS_ENV: "false",
  CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false",
  WRANGLER_LOG: "none",
  WRANGLER_SEND_ERROR_REPORTS: "false",
  WRANGLER_SEND_METRICS: "false",
} as const;

for (const [name, value] of Object.entries(localWorkerToolEnvironment)) {
  process.env[name] = value;
}

// Keep local development private to this machine and avoid implicit public asset escape hatches.
export default defineConfig({
  plugins: [
    react(),
    cloudflare({
      // Never connect local source to a deployed binding or expose it through a tunnel.
      remoteBindings: false,
      tunnel: false,
      inspectorPort: false,
    }),
  ],
  publicDir: false,
  envPrefix: [],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    allowedHosts: ["127.0.0.1", "localhost"],
    cors: false,
    fs: {
      strict: true,
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
    allowedHosts: ["127.0.0.1", "localhost"],
    cors: false,
  },
  build: {
    sourcemap: false,
  },
});
