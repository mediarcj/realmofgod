// File: apps/sanctuary/components/sanctuary/SanctuaryExperience.tsx
// Description: Loads the sanctuary renderer and contains render failures.
// Purpose: Keeps a readable page available while WebGL starts or fails.
// Notes: The renderer is loaded only in the browser.
"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

const SanctuaryCanvas = dynamic(() => import("./SanctuaryCanvas"), {
  ssr: false,
  loading: () => <p className="scene-message" role="status">Preparing the sanctuary…</p>,
});

class RenderBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="scene-message" role="alert">
      <p>The sanctuary view could not load.</p>
      <button onClick={() => window.location.reload()}>Try again</button>
    </div>;
    return this.props.children;
  }
}

export function SanctuaryExperience() {
  return <div className="scene-frame"><RenderBoundary><SanctuaryCanvas /></RenderBoundary></div>;
}
