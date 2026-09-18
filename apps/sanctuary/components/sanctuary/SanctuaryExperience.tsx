// File: apps/sanctuary/components/sanctuary/SanctuaryExperience.tsx
// Description: Loads the sanctuary renderer and contains render failures.
// Purpose: Keeps a readable page available while WebGL starts or fails.
// Notes: The renderer is loaded only in the browser.
"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { sanctuaryUnits } from "../../lib/sanctuary/asset-manifest";
import type { SanctuaryView } from "../../lib/sanctuary/camera";
import { ScripturePanel } from "./ScripturePanel";

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
  const [view, setView] = useState<SanctuaryView>("entry");
  const [loaded, setLoaded] = useState(0);
  const bibleButton = useRef<HTMLButtonElement>(null);
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const ready = loaded === sanctuaryUnits.length;
  return <>
    <div className="scene-frame"><RenderBoundary><SanctuaryCanvas view={view} reducedMotion={reducedMotion} onProgress={setLoaded} onBible={view === "room" ? () => { document.body.style.cursor = ""; setView("bible"); } : undefined} /></RenderBoundary></div>
    <div className="scene-shade" aria-hidden="true" />
    <header className="sanctuary-brand"><p>Realm of God</p><span>A place for quiet reflection</span></header>
    {view === "entry" ? <section className="entry-card" aria-labelledby="sanctuary-title">
      <p className="eyebrow">A moment apart</p>
      <h1 id="sanctuary-title">A quiet place<br />to be still.</h1>
      <p>Come as you are. Stay as long as you wish.</p>
      <button className="primary-button" disabled={!ready} onClick={() => setView("room")}>{ready ? "Enter the sanctuary" : "Preparing the sanctuary…"}</button>
      {!ready && <progress aria-label="Sanctuary loading" max={sanctuaryUnits.length} value={loaded} />}
      <p className="privacy-note">No account. No tracking.</p>
    </section> : <nav className="sanctuary-toolbar" aria-label="Sanctuary actions">
      <button ref={bibleButton} data-anchor="ROG_INT_Bible" onClick={() => setView("bible")}>Read Scripture</button>
      <button onClick={() => setView("entry")}>Return to entry</button>
    </nav>}
    {view === "bible" && <ScripturePanel onClose={() => { setView("room"); requestAnimationFrame(() => bibleButton.current?.focus()); }} />}
    <p className="visually-hidden" role="status">{ready ? "The sanctuary is ready." : "The sanctuary is loading."}</p>
  </>;
}
