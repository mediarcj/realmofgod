// File: apps/sanctuary/components/sanctuary/PrayerPanel.tsx
// Description: Offers historical sanctuary reflections in the raised prayer view.
// Purpose: Supports a private moment without collecting or prescribing prayer.
// Notes: The small panel never becomes a text entry or submission surface.

import { useEffect, useRef } from "react";
import { historicalPrayerReflections } from "../../lib/sanctuary/content";

export function PrayerPanel() {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <aside className="prayer-reading" aria-labelledby="prayer-title">
    <h2 id="prayer-title" ref={heading} tabIndex={-1}>Be still.</h2>
    {historicalPrayerReflections.map((reflection) => <p key={reflection}>{reflection}</p>)}
  </aside>;
}
