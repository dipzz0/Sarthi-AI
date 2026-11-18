import { useEffect, useRef, useState } from "react";

import splashVideo from "@/assets/sarthi-ai-splash.mp4.asset.json";
import { Button } from "@/components/ui/button";

const SPLASH_SESSION_KEY = "sarthi-ai-splash-seen";

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const fallbackTimer = useRef<number | null>(null);

  useEffect(() => {
    const seen = window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "true";
    setShowSplash(!seen);
    setReady(true);

    if (!seen) {
      fallbackTimer.current = window.setTimeout(() => finish(), 8000);
    }

    const replay = () => {
      window.sessionStorage.removeItem(SPLASH_SESSION_KEY);
      if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
      fallbackTimer.current = window.setTimeout(() => finish(), 8000);
      setShowSplash(true);
    };
    window.addEventListener("sarthi:replay-splash", replay);

    return () => {
      if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
      window.removeEventListener("sarthi:replay-splash", replay);
    };
  }, []);

  const finish = () => {
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "true");
    if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
    setShowSplash(false);
  };

  if (!ready) return <div className="min-h-screen bg-ink" />;

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[100] overflow-hidden bg-ink">
        <video
          className="h-full w-full object-cover"
          src={splashVideo.url}
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={finish}
          onError={finish}
          aria-label="Sarthi AI opening video"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={finish}
          className="absolute top-4 right-4 bg-background/80 shadow-panel backdrop-blur sm:top-6 sm:right-6"
        >
          Skip
        </Button>
      </div>
    );
  }

  return children;
}