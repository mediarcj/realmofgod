// File: apps/sanctuary/components/sanctuary/PrayerPanel.tsx
// Description: Offers a quiet, private moment at the prayer anchor.
// Purpose: Supports prayer without collecting text or prescribing a response.
// Notes: Escape and the return button always leave this view.

import { useEffect, useRef } from "react";

export function PrayerPanel({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  return <dialog ref={dialog} className="reflection-panel prayer-panel" aria-labelledby="prayer-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <p className="eyebrow">A quiet moment</p>
    <h2 id="prayer-title">Be still.</h2>
    <p>Take the time you need.</p>
    <p className="panel-note">Nothing to type. Nothing to submit.</p>
    <button className="primary-button" onClick={onClose}>Return to the sanctuary</button>
  </dialog>;
}
