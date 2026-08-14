/**
 * File: apps/sanctuary/worker/security-headers.ts
 * Description: Applies the privacy-preserving response headers proven by the local bootstrap.
 * Purpose: Prevents caching, referrer leakage, framing, MIME guessing, and unnecessary browser powers.
 * Notes: CSP is deliberately deferred until the required nonce or release-hash policy is implemented and tested.
 */

// Keep the proven bootstrap header set fixed and free of request or user-derived values.
const BOOTSTRAP_SECURITY_HEADERS = {
  "Cache-Control": "private, no-store, no-transform",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Origin-Agent-Cluster": "?1",
  "Permissions-Policy":
    "accelerometer=(), ambient-light-sensor=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), publickey-credentials-get=(), usb=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-DNS-Prefetch-Control": "off",
  "X-Frame-Options": "DENY",
} as const;

// Clone a response so static assets and fixed errors receive the same privacy baseline.
export function applyBootstrapSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  for (const [name, value] of Object.entries(BOOTSTRAP_SECURITY_HEADERS)) {
    headers.set(name, value);
  }

  // A broad self-only script policy would be weaker than the intended nonce/hash policy.
  headers.delete("Content-Security-Policy");
  headers.delete("Content-Security-Policy-Report-Only");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
