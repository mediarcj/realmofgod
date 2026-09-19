// File: apps/sanctuary/components/sanctuary/HomeControl.tsx
// Description: Provides the sanctuary's single persistent visible control.
// Purpose: Returns to the authored entrance framing without reloading the scene.
// Notes: The icon is inline so it has no separate asset or network dependency.

export function HomeControl({ onReturn }: { onReturn: () => void }) {
  return <button type="button" className="home-control" aria-label="Return to sanctuary entrance" onClick={onReturn}>
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></svg>
  </button>;
}
