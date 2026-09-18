// File: apps/sanctuary/next.config.ts
// Description: Declares the small initial Next.js configuration for Sanctuary V2.
// Purpose: Keeps framework configuration explicit while the application foundation is assembled.
// Notes: Browser 3D code is introduced through client components in later construction steps.

import type { NextConfig } from "next";

// Keep the first framework configuration intentionally small and easy to audit.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: false,
};

export default nextConfig;
