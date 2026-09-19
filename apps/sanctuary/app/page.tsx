// File: apps/sanctuary/app/page.tsx
// Description: Renders the object-driven Sanctuary V2 journey.
// Purpose: Leaves the accepted sanctuary itself as the primary interface.
// Notes: This page intentionally does not contain placeholder room geometry.

import { SanctuaryExperience } from "../components/sanctuary/SanctuaryExperience";

export default function SanctuaryHome() {
  // The client experience manages the minimal loading state and real object interactions.
  return (
    <main className="sanctuary-shell">
      <SanctuaryExperience />
    </main>
  );
}
