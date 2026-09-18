// File: apps/sanctuary/app/page.tsx
// Description: Renders the initial Sanctuary V2 application entry page.
// Purpose: Establishes a usable Next.js route before authoritative sanctuary geometry is added one piece at a time.
// Notes: This page intentionally does not contain placeholder room geometry.

export default function SanctuaryHome() {
  // Give visitors a calm, truthful loading state while the physical sanctuary begins with the accepted floor.
  return (
    <main className="sanctuary-shell">
      <section aria-labelledby="sanctuary-title" className="sanctuary-intro">
        <p className="sanctuary-kicker">Realm of God</p>
        <h1 id="sanctuary-title">Sanctuary V2</h1>
        <p>The sanctuary is being rebuilt from its accepted architectural source.</p>
      </section>
    </main>
  );
}
