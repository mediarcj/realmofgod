/**
 * File: apps/sanctuary/src/rendering/CinematicSanctuaryLayer.tsx
 * Description: Renders owner-provided local sanctuary media and reports its real native playback state.
 * Purpose: Lets development compare exact cinematic media with the real-time renderer without using WebGL for video.
 * Notes: The layer is lazy-loaded only in development and keeps media, playback, and errors in component memory.
 */

// Import React helpers for one native video element, a narrow parent control handle, and local media state.
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";

// Import repository-owned media bytes so the browser never resolves a remote artwork URL.
import canonicalStillUrl from "../assets/cinematic/hf01f-higgsfield-canonical-still.png";
import livingSanctuaryVideoUrl from "../assets/cinematic/hf01f-higgsfield-living-sanctuary.mp4";
import {
  selectCinematicMotionStatus,
  selectCinematicPresentation,
  type CinematicMotionStatus,
} from "./hybridProof";

// Describe the narrow visual-only inputs received from the view layer, not the Journey Engine.
interface CinematicSanctuaryLayerProps {
  readonly active: boolean;
  readonly forceFailure: boolean;
  readonly forceUnavailable: boolean;
  readonly onMotionStatusChange: (status: CinematicMotionStatus) => void;
  readonly reducedMotion: boolean;
}

// Expose only direct native pause/start actions so a development button can call video.play during a user gesture.
export interface CinematicPlaybackHandle {
  pauseMotion: () => void;
  startMotion: () => void;
}

// Normalize native autoplay/play calls while leaving an unavailable state visible to the development control.
function startNativePlayback(
  video: HTMLVideoElement,
  onPlayingChange: (playing: boolean) => void,
  onUnavailable: () => void,
): void {
  // Reinforce the markup attributes before requesting playback because browser autoplay checks read properties.
  video.defaultMuted = true;
  video.muted = true;
  video.volume = 0;
  void video
    .play()
    .then(() => {
      // A settled native play promise is the only condition that lets video pixels replace the stable poster.
      onPlayingChange(!video.paused);
    })
    .catch(() => {
      // Autoplay policy rejection is neither a decode error nor a reason to hide the still fallback.
      onPlayingChange(false);
      onUnavailable();
    });
}

// Render one decorative native-media layer whose pixels remain untouched by Canvas, WebGL, or effects.
const CinematicSanctuaryLayer = forwardRef<CinematicPlaybackHandle, CinematicSanctuaryLayerProps>(
  function CinematicSanctuaryLayer(
    { active, forceFailure, forceUnavailable, onMotionStatusChange, reducedMotion },
    ref,
  ): ReactNode {
    const videoRef = useRef<HTMLVideoElement>(null);
    const manuallyPausedRef = useRef(false);
    const [manuallyPaused, setManuallyPaused] = useState(false);
    const [mediaError, setMediaError] = useState(false);
    const [playbackUnavailable, setPlaybackUnavailable] = useState(false);
    const [videoPlaying, setVideoPlaying] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const [videoNetworkState, setVideoNetworkState] = useState<number | null>(null);
    const videoFailed = forceFailure || mediaError;
    const motionStatus = selectCinematicMotionStatus({
      manuallyPaused,
      playbackUnavailable: playbackUnavailable || forceUnavailable,
      reducedMotion,
      videoFailed,
      videoPlaying,
      videoReady,
    });
    const presentation = selectCinematicPresentation(motionStatus);

    // Make the current native state available to sibling development controls without exposing it in production.
    useEffect(() => {
      onMotionStatusChange(motionStatus);
    }, [motionStatus, onMotionStatusChange]);

    // Observe readiness and spontaneous native play/pause events because controls must report actual media state.
    useEffect(() => {
      const video = videoRef.current;
      if (video === null || reducedMotion || forceFailure) {
        return;
      }

      // Read network state from the native element so the development proof can distinguish loaded media from intent.
      const reportNetworkState = (): void => {
        setVideoNetworkState(video.networkState);
      };
      const markReady = (): void => {
        setVideoReady(true);
        reportNetworkState();
      };
      const markPlaying = (): void => {
        setPlaybackUnavailable(false);
        setVideoPlaying(true);
        reportNetworkState();
      };
      const markPaused = (): void => {
        setVideoPlaying(false);
        reportNetworkState();
        if (!manuallyPausedRef.current) {
          setPlaybackUnavailable(true);
        }
      };
      const markFailure = (): void => {
        setMediaError(true);
        setVideoPlaying(false);
        reportNetworkState();
      };

      // Browser media can become ready before React attaches its event listener, so inspect the current state too.
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        markReady();
      }
      video.addEventListener("canplay", markReady);
      video.addEventListener("error", markFailure);
      video.addEventListener("pause", markPaused);
      video.addEventListener("play", markPlaying);

      return () => {
        video.removeEventListener("canplay", markReady);
        video.removeEventListener("error", markFailure);
        video.removeEventListener("pause", markPaused);
        video.removeEventListener("play", markPlaying);
      };
    }, [forceFailure, reducedMotion]);

    // Attempt normal muted autoplay only after usable data; a rejection remains recoverable by a direct user gesture.
    useEffect(() => {
      const video = videoRef.current;
      if (video === null) {
        return;
      }
      if (
        !active ||
        reducedMotion ||
        videoFailed ||
        manuallyPaused ||
        !videoReady ||
        forceUnavailable
      ) {
        video.pause();
        setVideoPlaying(false);
        return;
      }

      startNativePlayback(video, setVideoPlaying, () => {
        setPlaybackUnavailable(true);
      });
    }, [active, forceUnavailable, manuallyPaused, reducedMotion, videoFailed, videoReady]);

    useImperativeHandle(
      ref,
      () => ({
        pauseMotion: () => {
          const video = videoRef.current;
          manuallyPausedRef.current = true;
          setManuallyPaused(true);
          setPlaybackUnavailable(false);
          if (video !== null) {
            video.pause();
          }
          setVideoPlaying(false);
        },
        startMotion: () => {
          const video = videoRef.current;
          if (video === null || reducedMotion || videoFailed || !videoReady) {
            return;
          }

          // This handle is reached synchronously from an ordinary button click or keyboard activation.
          manuallyPausedRef.current = false;
          setManuallyPaused(false);
          setPlaybackUnavailable(false);
          startNativePlayback(video, setVideoPlaying, () => {
            setPlaybackUnavailable(true);
          });
        },
      }),
      [reducedMotion, videoFailed, videoReady],
    );

    return (
      <div
        className="cinematic-media-layer"
        data-cinematic-active={active ? "true" : "false"}
        data-cinematic-motion-status={motionStatus}
        data-cinematic-presentation={presentation}
        data-cinematic-video-failed={videoFailed ? "true" : "false"}
        data-cinematic-video-network-state={videoNetworkState ?? "unknown"}
        data-cinematic-video-ready={videoReady ? "true" : "false"}
        aria-hidden="true"
      >
        <img className="cinematic-media-poster" src={canonicalStillUrl} alt="" />
        {!reducedMotion && !forceFailure ? (
          <video
            ref={videoRef}
            className="cinematic-media-video"
            autoPlay={active && !manuallyPaused}
            loop
            muted
            playsInline
            poster={canonicalStillUrl}
            preload="metadata"
            tabIndex={-1}
          >
            <source src={livingSanctuaryVideoUrl} type="video/mp4" />
          </video>
        ) : null}
      </div>
    );
  },
);

export default CinematicSanctuaryLayer;
