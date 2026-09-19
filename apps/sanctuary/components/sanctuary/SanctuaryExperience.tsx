// File: apps/sanctuary/components/sanctuary/SanctuaryExperience.tsx
// Description: Loads the sanctuary renderer and contains render failures.
// Purpose: Keeps a readable page available while WebGL starts or fails.
// Notes: The renderer is loaded only in the browser.
"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useReducer, useState, type ReactNode } from "react";
import { sanctuaryUnits } from "../../lib/sanctuary/asset-manifest";
import { initialJourney, journeyTransition } from "../../lib/sanctuary/journey";

const SanctuaryCanvas = dynamic(() => import("./SanctuaryCanvas"), {
  ssr: false,
  loading: () => null,
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
  const [journey, dispatch] = useReducer(journeyTransition, initialJourney);
  const onActivate = useCallback((object: string) => dispatch({ type: "activate", object }), []);
  const onSettled = useCallback((revision: number) => dispatch({ type: "settled", revision }), []);
  const [loaded, setLoaded] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const ready = loaded === sanctuaryUnits.length;
  return <>
    <div className="scene-frame" data-view={journey.view} data-moving={journey.moving}><RenderBoundary><SanctuaryCanvas view={journey.view} reducedMotion={reducedMotion} onProgress={setLoaded} revision={journey.revision} onSettled={onSettled} interactive={ready && !journey.moving} onActivate={onActivate} /></RenderBoundary></div>
    {!ready && <div className="loading-mark" role="progressbar" aria-label="Loading sanctuary" aria-valuemin={0} aria-valuemax={sanctuaryUnits.length} aria-valuenow={loaded}><span style={{ transform: `scaleX(${loaded / sanctuaryUnits.length})` }} /></div>}
    <p className="visually-hidden" role="status">{ready ? "The sanctuary is ready." : "The sanctuary is loading."}</p>
  </>;
}
