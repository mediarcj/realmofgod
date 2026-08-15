/**
 * File: apps/sanctuary/vitest.config.ts
 * Description: Configures focused Node-based unit tests for the sanctuary package.
 * Purpose: Tests deterministic rendering decisions without requiring real GPU hardware in CI.
 * Notes: Browser Canvas rendering is covered separately by the local loopback smoke check.
 */

// Import Vite's typed helper to keep the package test configuration small and explicit.
import { defineConfig } from "vitest/config";

// Run only local source tests in Node so hardware capability is mocked at the decision boundary.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
