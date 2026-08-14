/**
 * File: apps/sanctuary/worker/config.ts
 * Description: Defines the tiny local configuration surface for the inert Worker shell.
 * Purpose: Rejects missing, hosted, or unexpected modes before any request reaches an asset.
 * Notes: This is bootstrap validation, not the later full application configuration authority.
 */

// Model only the local asset binding and non-secret environment marker used in Phase 2.
export interface AssetFetcher {
  fetch(request: Request): Promise<Response>;
}

export interface SanctuaryWorkerEnv {
  readonly APP_ENV?: string;
  readonly ASSETS: AssetFetcher;
}

export type LocalAppEnvironment = "local" | "test";

// Accept only local synthetic modes and fail closed for every production-like value.
export function requireLocalAppEnvironment(value: string | undefined): LocalAppEnvironment {
  if (value === "local" || value === "test") {
    return value;
  }

  throw new Error("Worker local environment is invalid.");
}
