/**
 * File: apps/sanctuary/src/rendering/CinematicSanctuaryLayer.tsx
 * Description: Renders owner-provided local sanctuary media as a decorative native browser video layer.
 * Purpose: Lets development compare exact cinematic media with the real-time renderer without using WebGL for video.
 * Notes: The layer is lazy-loaded only in development and keeps media, playback, and errors in component memory.
 */

// Import React lifecycle helpers for one native video element and its local ready/error state.
import { useEffect, useRef, useState, type ReactNode } from "react";

// Import repository-owned media bytes so the browser never resolves a remote artwork URL.
import canonicalStillUrl from "../assets/cinematic/hf01f-higgsfield-canonical-still.png";
import livingSanctuaryVideoUrl from "../assets/cinematic/hf01f-higgsfield-living-sanctuary.mp4";
import { selectCinematicPresentation } from "./hybridProof";

// Describe the narrow visual-only inputs received from the view layer, not the Journey Engine.
interface CinematicSanctuaryLayerProps {
  readonly active: boolean;
  readonly paused: boolean;
  readonly reducedMotion: boolean;
  readonly forceFailure: boolean;
}

// Keep a native video paused whenever movement is unavailable, manually paused, hidden, or failed.
function synchronizeVideoPlayback(
  video: HTMLVideoElement,
  shouldPlay: boolean,
  onPlaybackChange: (playing: boolean) => void,
): void {
  if (!shouldPlay) {
    video.pause();
    onPlaybackChange(false);
    return;
  }

  // Reinforce the markup attributes before requesting playback because browser autoplay checks read properties.
  video.defaultMuted = true;
  video.muted = true;
  video.volume = 0;
  void video
    .play()
    .catch(() => {
      // An autoplay policy rejection is not a decode error; keep the approved still until a user gesture resumes motion.
      onPlaybackChange(false);
    })
    .then(() => {
      // A settled native play promise is the only condition that lets video pixels replace the stable poster.
      if (!video.paused) {
        onPlaybackChange(true);
      }
    });
}

// Render one decorative native-media layer whose pixels remain untouched by Canvas, WebGL, or effects.
export default function CinematicSanctuaryLayer({
  active,
  paused,
  reducedMotion,
  forceFailure,
}: CinematicSanctuaryLayerProps): ReactNode {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const videoFailed = forceFailure || mediaError;
  const presentation = selectCinematicPresentation({
    reducedMotion,
    paused,
    videoPlaying,
    videoFailed,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (video === null || reducedMotion || forceFailure) {
      return;
    }

    // Browser media can become ready before React attaches its event listener, so inspect the current state too.
    const markReady = (): void => {
      setVideoReady(true);
    };
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      markReady();
    }
    video.addEventListener("loadeddata", markReady);
    video.addEventListener("canplay", markReady);

    return () => {
      video.removeEventListener("loadeddata", markReady);
      video.removeEventListener("canplay", markReady);
    };
  }, [forceFailure, reducedMotion]);

  useEffect(() => {
    const video = videoRef.current;
    if (video === null) {
      return;
    }

    synchronizeVideoPlayback(
      video,
      active && videoReady && !reducedMotion && !paused && !videoFailed,
      setVideoPlaying,
    );
  }, [active, paused, reducedMotion, videoFailed, videoReady]);

  return (
    <div
      className="cinematic-media-layer"
      data-cinematic-active={active ? "true" : "false"}
      data-cinematic-video-failed={videoFailed ? "true" : "false"}
      data-cinematic-video-ready={videoReady ? "true" : "false"}
      data-cinematic-presentation={presentation}
      aria-hidden="true"
    >
      <img className="cinematic-media-poster" src={canonicalStillUrl} alt="" />
      {!reducedMotion && !forceFailure ? (
        <video
          ref={videoRef}
          className="cinematic-media-video"
          autoPlay={active && !paused}
          loop
          muted
          playsInline
          poster={canonicalStillUrl}
          preload="metadata"
          tabIndex={-1}
          onCanPlay={() => {
            setVideoReady(true);
          }}
          onError={() => {
            // A real media error is distinct from autoplay policy and leaves the canonical still in place.
            setMediaError(true);
            setVideoPlaying(false);
          }}
        >
          <source src={livingSanctuaryVideoUrl} type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}
