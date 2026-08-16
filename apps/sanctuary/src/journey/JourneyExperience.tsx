/**
 * File: apps/sanctuary/src/journey/JourneyExperience.tsx
 * Description: Renders the complete anonymous DOM-first “I need peace” journey vertical slice.
 * Purpose: Provides one keyboard-accessible, memory-only progression without accounts, collection, or scoring.
 * Notes: Choices shape the immediate reflection beat, not a visitor's worth or a lasting profile.
 */

// Import React's focus tools and type-only journey content/model contracts.
import { useEffect, useRef, type ReactNode } from "react";

import { choiceReflections, peaceScripture } from "./content";
import { type JourneyAction, type JourneyState, type PeaceChoice } from "./model";

// Describe one display choice without assigning a score, rank, or hidden meaning.
interface ChoiceButton {
  readonly choice: PeaceChoice;
  readonly label: string;
}

// Keep the three valid choices in one small local list for consistent accessible controls.
const choiceButtons: readonly ChoiceButton[] = [
  { choice: "walk", label: "Continue walking" },
  { choice: "sit", label: "Sit and rest" },
  { choice: "listen", label: "Listen" },
];

// Provide a small button group that remains semantic and usable without any visual renderer.
function JourneyActions({ children }: { readonly children: ReactNode }) {
  return <div className="journey-actions">{children}</div>;
}

// Render stage-specific content while keeping every progression control in ordinary HTML buttons.
function JourneyStageContent({
  state,
  dispatch,
}: {
  readonly state: JourneyState;
  readonly dispatch: (action: JourneyAction) => void;
}) {
  // Bind one explicit reducer action per button without returning a dispatch result from an event callback.
  const actionHandler = (action: JourneyAction): (() => void) => {
    return () => {
      dispatch(action);
    };
  };

  switch (state.stage) {
    case "entry":
      return (
        <>
          <p className="journey-prompt">What brings you here?</p>
          <JourneyActions>
            <button type="button" onClick={actionHandler({ type: "begin-peace" })}>
              I need peace
            </button>
          </JourneyActions>
        </>
      );
    case "threshold":
      return (
        <>
          <p>There is nowhere you need to rush to.</p>
          <JourneyActions>
            <button type="button" onClick={actionHandler({ type: "continue" })}>
              Continue when you’re ready
            </button>
          </JourneyActions>
        </>
      );
    case "movement":
      return (
        <>
          <p>Take the next step only when it feels right.</p>
          <JourneyActions>
            <button type="button" onClick={actionHandler({ type: "continue" })}>
              Continue walking
            </button>
          </JourneyActions>
        </>
      );
    case "choice":
      return (
        <>
          <p>Choose what feels most fitting for this moment.</p>
          <JourneyActions>
            {choiceButtons.map(({ choice, label }) => (
              <button
                key={choice}
                type="button"
                onClick={actionHandler({ type: "choose", choice })}
              >
                {label}
              </button>
            ))}
          </JourneyActions>
        </>
      );
    case "reflection":
      return (
        <>
          <p>{choiceReflections[state.choice].text}</p>
          <JourneyActions>
            <button type="button" onClick={actionHandler({ type: "continue" })}>
              Continue
            </button>
          </JourneyActions>
        </>
      );
    case "scripture":
      return (
        <>
          <section className="scripture-slot" aria-labelledby="scripture-reference">
            <p className="scripture-label">Scripture</p>
            <h2 id="scripture-reference">{peaceScripture.reference}</h2>
            <p>Verse wording is pending a translation and licensing decision.</p>
          </section>
          <JourneyActions>
            <button type="button" onClick={actionHandler({ type: "continue" })}>
              Continue
            </button>
          </JourneyActions>
        </>
      );
    case "stillness":
      return (
        <>
          <p>Nothing else is asked of you right now.</p>
          <JourneyActions>
            <button type="button" onClick={actionHandler({ type: "remain" })}>
              Remain here
            </button>
            <button type="button" onClick={actionHandler({ type: "continue" })}>
              Continue
            </button>
          </JourneyActions>
        </>
      );
    case "sanctuary":
      return (
        <>
          <p>You may stay as long as you like.</p>
          <p>Pray quietly, reflect, or simply be still.</p>
          <JourneyActions>
            <button type="button" onClick={actionHandler({ type: "remain" })}>
              Remain here
            </button>
            <button type="button" onClick={actionHandler({ type: "return-to-realm" })}>
              Return to Realm
            </button>
          </JourneyActions>
        </>
      );
  }
}

// Describe the controlled semantic surface without exposing any renderer concern to journey content.
interface JourneyExperienceProps {
  readonly state: JourneyState;
  readonly dispatch: (action: JourneyAction) => void;
}

// Place focus on the changed stage heading while the parent retains the one authoritative reducer.
export function JourneyExperience({ state, dispatch }: JourneyExperienceProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasMounted = useRef(false);

  useEffect(() => {
    // Leave ordinary document focus untouched on arrival, then announce intentional stage changes.
    if (hasMounted.current) {
      headingRef.current?.focus();
    } else {
      hasMounted.current = true;
    }
  }, [state.stage]);

  return (
    <section className="journey-panel" aria-live="polite" aria-labelledby="journey-stage">
      <h2 id="journey-stage" ref={headingRef} tabIndex={-1}>
        {state.stage === "entry" ? "A gentle beginning" : "I need peace"}
      </h2>
      <JourneyStageContent state={state} dispatch={dispatch} />
    </section>
  );
}
