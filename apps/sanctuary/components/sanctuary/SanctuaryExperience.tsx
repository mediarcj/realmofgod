// File: apps/sanctuary/components/sanctuary/SanctuaryExperience.tsx
// Description: Loads the sanctuary renderer and contains render failures.
// Purpose: Keeps a readable page available while WebGL starts or fails.
// Notes: The renderer is loaded only in the browser.
"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useReducer, useState, type ReactNode } from "react";
import { sanctuaryUnits } from "../../lib/sanctuary/asset-manifest";
import { devotionalLabels, eligibleObjects, initialJourney, journeyTransition } from "../../lib/sanctuary/journey";
import { ScripturePanel } from "./ScripturePanel";
import { PrayerPanel } from "./PrayerPanel";
import { HomeControl } from "./HomeControl";

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
  const onPray = useCallback(() => dispatch({ type: "pray" }), []);
  const onReturn = useCallback(() => dispatch({ type: "home" }), []);
  const [loaded, setLoaded] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && (journey.view === "bible" || journey.view === "prayer")) onReturn();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [journey.view, onReturn]);
  const ready = loaded === sanctuaryUnits.length;
  return <>
    <div className="scene-frame" data-view={journey.view} data-moving={journey.moving}><RenderBoundary><SanctuaryCanvas view={journey.view} reducedMotion={reducedMotion} onProgress={setLoaded} revision={journey.revision} onSettled={onSettled} interactive={ready && !journey.moving} onActivate={onActivate} /></RenderBoundary></div>
    <HomeControl onReturn={onReturn} />
    {!journey.moving && <nav className="visually-hidden" aria-label="Devotional interactions">
      {eligibleObjects(journey.view).map((object) => <button key={object} type="button" onClick={() => onActivate(object)}>{devotionalLabels[object]}</button>)}
    </nav>}
    {!ready && <div className="loading-mark" role="progressbar" aria-label="Loading sanctuary" aria-valuemin={0} aria-valuemax={sanctuaryUnits.length} aria-valuenow={loaded}><span style={{ transform: `scaleX(${loaded / sanctuaryUnits.length})` }} /></div>}
    {journey.view === "bible" && !journey.moving && <ScripturePanel onPray={onPray} />}
    {journey.view === "prayer" && !journey.moving && <PrayerPanel />}
    <p className="visually-hidden" role="status">{ready ? "The sanctuary is ready." : "The sanctuary is loading."}</p>
  </>;
}
