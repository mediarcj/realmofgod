/**
 * File: apps/sanctuary/types/tooling-env.d.ts
 * Description: Marks the local build-tool TypeScript project as an explicit isolated module.
 * Purpose: Keeps Node-only build-tool types out of browser and Worker projects.
 * Notes: Node types are confined to this tooling project and never enter browser or Worker code.
 */

// Keep this declaration module empty while preserving the tools-only type boundary.
export {};
