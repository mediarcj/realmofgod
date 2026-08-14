/**
 * File: apps/sanctuary/src/main.tsx
 * Description: Starts the local React sanctuary bundle.
 * Purpose: Mounts the minimal shell at one verified document root.
 * Notes: This bootstrap performs no storage, authentication, provider, or network work.
 */

// Import only React, its local renderer, and sanctuary-owned source assets.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { SanctuaryShell } from "./SanctuaryShell";
import "./sanctuary.css";

// Fail clearly and without user data if the static entry document is malformed.
const rootElement = document.getElementById("root");

if (!(rootElement instanceof HTMLElement)) {
  throw new Error("Sanctuary root element is unavailable.");
}

// StrictMode keeps the initial component honest while the local foundation is built.
createRoot(rootElement).render(
  <StrictMode>
    <SanctuaryShell />
  </StrictMode>,
);
