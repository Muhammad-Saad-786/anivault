// src/components/pwa/InstallPrompt.jsx
import { useState, useEffect } from "react";
import { Download, X, Share, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const DISMISSED_KEY = "pwa-prompt-dismissed-v1";

export default function InstallPrompt({ variant = "default", className }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start hidden, decide in effect

  /* -------- Detect platform + installed state -------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const iosStandalone =
      window.navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    const androidStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;

    setIsIOS(isIOSDevice);
    setIsStandalone(iosStandalone || androidStandalone);

    const wasDismissed = localStorage.getItem(DISMISSED_KEY) === "1";
    setDismissed(wasDismissed);
  }, []);

  /* -------- Capture Android/Chromium install event -------- */
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  /* -------- Decide whether to render -------- */
  // Already installed → hide
  if (isStandalone) return null;
  // User dismissed → hide
  if (dismissed) return null;

  // Android / Chromium with install prompt available
  const canInstallNative = !!deferredPrompt;

  // iOS Safari — show manual hint
  const showIosHint =
    isIOS &&
    !deferredPrompt &&
    /Safari/.test(window.navigator.userAgent) &&
    !/CriOS|FxiOS|EdgiOS/.test(window.navigator.userAgent);

  // Neither available → hide
  if (!canInstallNative && !showIosHint) return null;

  /* -------- Compact variant (footer) -------- */
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-border-dark bg-surface-card px-3 py-2 text-xs",
          className,
        )}
      >
        {canInstallNative ? (
          <button
            onClick={install}
            className="flex items-center gap-1.5 font-semibold text-brand hover:underline"
          >
            <Download className="h-3.5 w-3.5" /> Install AniVault
          </button>
        ) : (
          <span className="flex items-center gap-1.5 font-semibold text-brand">
            <Share className="h-3.5 w-3.5" />
            <span>Share → Add to Home Screen</span>
          </span>
        )}
        <button
          onClick={dismiss}
          className="rounded p-0.5 text-text-muted hover:text-text-primary"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  /* -------- Default variant (banner) -------- */
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-card border border-border-dark bg-surface-card p-4",
        className,
      )}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
        <Download className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Install AniVault</p>

        {canInstallNative ? (
          <p className="mt-0.5 text-xs text-text-secondary">
            Add AniVault to your home screen for the best experience.
          </p>
        ) : (
          <div className="mt-1 space-y-1 text-xs text-text-secondary">
            <p>Install AniVault in 2 steps:</p>
            <ol className="ml-4 list-decimal space-y-0.5">
              <li className="flex items-center gap-1">
                Tap <Share className="inline h-3 w-3" /> Share in Safari
              </li>
              <li className="flex items-center gap-1">
                <Plus className="inline h-3 w-3" /> Add to Home Screen
              </li>
            </ol>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          {canInstallNative && (
            <button onClick={install} className="btn-brand !text-xs">
              <Download className="h-3.5 w-3.5" /> Install
            </button>
          )}
          <button onClick={dismiss} className="btn-ghost !text-xs">
            {canInstallNative ? "Later" : "Got it"}
          </button>
        </div>
      </div>

      <button
        onClick={dismiss}
        className="rounded p-1 text-text-muted hover:text-text-primary"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
