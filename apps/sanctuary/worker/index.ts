/**
 * File: apps/sanctuary/worker/index.ts
 * Description: Implements the first inert same-origin Worker backend boundary.
 * Purpose: Serves local static assets while refusing API, unsafe-method, remote-host, and invalid-mode requests.
 * Notes: Authentication, sessions, data access, prayer handling, and provider calls are intentionally absent.
 */

// Import only local configuration and response-hardening helpers.
import { requireLocalAppEnvironment, type SanctuaryWorkerEnv } from "./config";
import { applyBootstrapSecurityHeaders } from "./security-headers";

// Permit only the hostnames that can represent the loopback-only Phase 2 preview.
const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "localhost", "[::1]"]);

// Return a fixed response that contains no request, account, or user-derived content.
function fixedFailure(status: number, code: string): Response {
  return applyBootstrapSecurityHeaders(
    Response.json(
      { error: code },
      {
        status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    ),
  );
}

// Recognize the entire reserved API namespace without inspecting a request body.
function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

// Keep the exported handler testable as an ordinary standards-based TypeScript function.
export async function handleSanctuaryRequest(
  request: Request,
  env: SanctuaryWorkerEnv,
): Promise<Response> {
  try {
    requireLocalAppEnvironment(env.APP_ENV);
  } catch {
    return fixedFailure(503, "local_environment_unavailable");
  }

  const url = new URL(request.url);

  if (!LOOPBACK_HOSTNAMES.has(url.hostname)) {
    return fixedFailure(403, "local_host_required");
  }

  if (isApiPath(url.pathname)) {
    return fixedFailure(404, "api_not_available");
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return fixedFailure(405, "method_not_allowed");
  }

  try {
    // The ASSETS binding is the only allowed downstream and cannot make an external provider call.
    const assetResponse = await env.ASSETS.fetch(request);
    return applyBootstrapSecurityHeaders(assetResponse);
  } catch {
    return fixedFailure(503, "local_asset_unavailable");
  }
}

// Export the standard module Worker shape without adding scheduled, queue, or other handlers.
export default {
  fetch(request: Request, env: SanctuaryWorkerEnv): Promise<Response> {
    return handleSanctuaryRequest(request, env);
  },
};
