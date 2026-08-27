/**
 * File: apps/sanctuary/src/sanctuary/SanctuaryHomeControl.tsx
 * Description: Renders the small global DOM return control for settled sanctuary states.
 * Purpose: Gives keyboard, pointer, and touch visitors one quiet way to return to the sanctuary beginning.
 * Notes: The icon is project-owned inline SVG; it has no Canvas behavior, persistence, or state authority of its own.
 */

// Render an ordinary button so mouse, trackpad, keyboard, and touch share the same semantic action.
export function SanctuaryHomeControl({
  onReturnToSanctuary,
}: {
  readonly onReturnToSanctuary: () => void;
}) {
  return (
    <button
      aria-label="Return to sanctuary"
      className="sanctuary-home-control"
      onClick={onReturnToSanctuary}
      type="button"
    >
      {/* Keep the owned outline compact and decorative because the button label carries the accessible meaning. */}
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
        <path d="m3.5 10.5 8.5-7 8.5 7v9.25a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1-.75-.75Z" />
        <path d="M9.25 20.5v-5.75h5.5v5.75M7.25 10.75h9.5" />
      </svg>
    </button>
  );
}
