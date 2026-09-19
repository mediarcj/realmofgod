// File: apps/sanctuary/components/sanctuary/ScripturePanel.tsx
// Description: Presents the source-approved Scripture reference beside the Bible.
// Purpose: Begins the journey's only visible devotional wording without inventing text.
// Notes: Verse wording remains absent until translation and licensing are approved.

import { useEffect, useRef } from "react";
import { historicalScripture } from "../../lib/sanctuary/content";

export function ScripturePanel({ onPray }: { onPray: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return <aside className="bible-reading" aria-labelledby="reading-title">
    <h2 id="reading-title" ref={heading} tabIndex={-1}>Scripture</h2>
    <p className="scripture-reference">{historicalScripture.reference}</p>
    <p className="reading-note">Verse wording is pending a translation and licensing decision.</p>
    <button className="prayer-action" onClick={onPray}>Let&apos;s Pray</button>
  </aside>;
}
