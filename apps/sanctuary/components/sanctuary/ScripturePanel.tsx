// File: apps/sanctuary/components/sanctuary/ScripturePanel.tsx
// Description: Presents approved readings in an accessible, quiet dialog.
// Purpose: Keeps the sanctuary visible while supporting keyboard and touch reading.
// Notes: Missing content is an honest empty state, never substitute Scripture.

import { useEffect, useRef, useState } from "react";
import { isCompleteReading, scriptureSource, type ScriptureReading } from "../../lib/sanctuary/content";

export function ScripturePanel({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [reading, setReading] = useState<ScriptureReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    let active = true;
    scriptureSource.read().then((result) => {
      if (active) { setReading(result && isCompleteReading(result) ? result : null); setLoading(false); }
    }).catch(() => { if (active) { setFailed(true); setLoading(false); } });
    return () => { active = false; element?.close(); };
  }, []);
  return <dialog ref={dialog} className="reflection-panel" aria-labelledby="reading-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <button className="panel-close" aria-label="Close Scripture" onClick={onClose}>Close</button>
    <p className="eyebrow">At the open Bible</p>
    <h2 id="reading-title">Scripture</h2>
    {loading ? <p role="status">Preparing the reading…</p> : reading ? <article>
      <h3>{reading.reference}</h3><p className="scripture-text">{reading.text}</p>
      <footer>{reading.translation}<br />{reading.attribution}</footer>
    </article> : <div role="status"><p>{failed ? "The reading could not be loaded." : "A Scripture reading is not available yet."}</p><p className="panel-note">You are welcome to remain here in quiet reflection.</p></div>}
    <button className="primary-button" onClick={onClose}>Return to the sanctuary</button>
  </dialog>;
}
