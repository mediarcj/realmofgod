/**
 * File: apps/sanctuary/types/tooling-env.d.ts
 * Description: Marks the local build-tool TypeScript project as an explicit isolated module.
 * Purpose: Lets strict tooling configuration checks run before Vite configuration is introduced.
 * Notes: Node types are confined to this tooling project and never enter browser or Worker code.
 */

// Keep this placeholder module empty while preserving the tools-only type boundary.
export {};
