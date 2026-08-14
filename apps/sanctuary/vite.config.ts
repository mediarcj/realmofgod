/**
 * File: apps/sanctuary/vite.config.ts
 * Description: Configures the local Vite browser build for the isolated sanctuary package.
 * Purpose: Keeps development loopback-only and produces a source-map-free local bundle.
 * Notes: Worker integration is introduced as its own later Phase 2 journey checkpoint.
 */

// Import only the official React integration and Vite's typed configuration helper.
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Keep local development private to this machine and avoid implicit public asset escape hatches.
export default defineConfig({
  plugins: [react()],
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
