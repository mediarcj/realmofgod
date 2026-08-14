/**
 * File: apps/sanctuary/src/SanctuaryShell.tsx
 * Description: Renders the first quiet, non-interactive sanctuary placeholder.
 * Purpose: Proves the isolated React entry point without collecting or displaying prayer data.
 * Notes: Product interaction, accounts, persistence, and vault behavior belong to later phases.
 */

// Keep the first component intentionally static so no private-data pathway exists yet.
export function SanctuaryShell() {
  return (
    <main className="sanctuary-shell" aria-labelledby="sanctuary-title">
      <section className="sanctuary-introduction">
        <p className="sanctuary-name">Realm of God</p>
        <h1 id="sanctuary-title">A quiet place is being prepared.</h1>
        <p className="sanctuary-summary">
          This local foundation will grow into a private retreat for prayer and reflection.
        </p>
      </section>

      <aside className="foundation-note" aria-label="Current foundation status">
        <p>No account, prayer entry, or saved content is active in this foundation.</p>
      </aside>
    </main>
  );
}
