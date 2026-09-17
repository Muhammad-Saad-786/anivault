// src/pages/Wrapped.jsx
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Download,
  Share2,
  Trophy,
  Tv,
  Clock,
  Heart,
} from "lucide-react";
import { toPng } from "html-to-image";
import { useAuth } from "@/hooks/useAuth";
import { getUserStats } from "@/lib/api/stats";
import Spinner from "@/components/ui/Spinner";
import AlertDialog from "@/components/ui/AlertDialog";
import { formatCount } from "@/lib/utils";
import SEO from "@/components/SEO";

export default function Wrapped() {
  const { user, profile } = useAuth();
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);

  const year = new Date().getFullYear();
  const { data: s, isLoading } = useQuery({
    queryKey: ["stats", user?.id],
    queryFn: () => getUserStats(user.id),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!s || s.total === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-xl font-bold">Not enough data yet</p>
        <p className="mt-2 text-sm text-text-secondary">
          Add some anime and rate them to unlock your Wrapped.
        </p>
        <Link to="/search" className="btn-brand mt-4">
          Browse anime
        </Link>
      </div>
    );
  }

  const topAnime = s.topRated[0];

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);

    try {
      // Wait for all images (AniList posters, avatar) to finish loading
      const images = cardRef.current.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) return resolve();
              img.onload = resolve;
              img.onerror = resolve;
            }),
        ),
      );

      // Give fonts + layout a frame to settle
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r)),
      );

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true, // avoids cached CORS taint
        pixelRatio: 2, // 2x = retina quality
        backgroundColor: "#0d0d0d",
        skipFonts: false,
        filter: (node) => {
          // Optional: skip any button overlays
          return node.tagName !== "BUTTON";
        },
      });

      // Convert dataUrl → blob → trigger download
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `anivault-wrapped-${year}-${profile?.username || "me"}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[wrapped] download failed", err);
      alert("Could not generate image. Try again or take a manual screenshot.");
    } finally {
      setDownloading(false);
    }
  };

  const share = async () => {
    const text = `My ${year} AniVault Wrapped: ${s.completed} anime completed, ${formatCount(s.episodesWatched)} episodes watched, favorite genre: ${s.favoriteGenre || "N/A"}!`;
    if (navigator.share) {
      await navigator.share({
        title: `AniVault Wrapped ${year}`,
        text,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(text);
      setShowCopiedAlert(true);
    }
  };

  return (
    <>
      <SEO
        title={`${year} Anime Wrapped`}
        description="See your year in anime with AniVault Wrapped."
      />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Share bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/stats"
            className="text-sm text-text-secondary hover:text-brand"
          >
            ← Back to stats
          </Link>

          <div className="flex gap-2">
            <button onClick={share} className="btn-ghost">
              <Share2 className="h-4 w-4" /> Share
            </button>
            <button
              onClick={download}
              disabled={downloading}
              className="btn-brand"
            >
              <Download className="h-4 w-4" />
              {downloading ? "Creating…" : "Download card"}
            </button>
          </div>
        </div>

        {/* The wrapped card (captured for export) */}
        <div ref={cardRef} className="overflow-hidden rounded-3xl">
          <div className="relative bg-gradient-to-br from-[#1a0000] via-[#0d0d0d] to-[#000000] p-8 sm:p-12">
            {/* Decorative background */}
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-brand blur-3xl" />
              <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-purple-600 blur-3xl" />
            </div>

            <div className="relative">
              {/* Header */}
              <div className="mb-10 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand">
                  AniVault Wrapped
                </p>
                <h1 className="mt-2 bg-gradient-to-r from-white to-white/70 bg-clip-text text-5xl font-black text-transparent sm:text-6xl">
                  {year}
                </h1>
                <p className="mt-2 text-sm text-white/60">
                  {profile?.display_name || profile?.username}'s year in anime
                </p>
              </div>

              {/* Top anime hero */}
              {topAnime && (
                <div className="mb-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                  <img
                    src={topAnime.poster_url}
                    alt={topAnime.title_en || topAnime.title_romaji}
                    crossOrigin="anonymous"
                    className="h-40 w-28 rounded-xl object-cover shadow-2xl ring-2 ring-brand/50 sm:h-56 sm:w-40"
                  />
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-bold uppercase tracking-widest text-brand">
                      <Trophy className="mr-1 inline h-3 w-3" />
                      #1 Rated
                    </p>
                    <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                      {topAnime.title_en || topAnime.title_romaji}
                    </h2>
                    <p className="mt-1 text-sm text-white/60">
                      You rated it ★ {topAnime.userRating}
                    </p>
                  </div>
                </div>
              )}

              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <WrappedStat
                  icon={Tv}
                  value={s.completed}
                  label="Completed"
                  accent
                />
                <WrappedStat
                  icon={Clock}
                  value={formatCount(s.episodesWatched)}
                  label="Episodes"
                />
                <WrappedStat
                  icon={Sparkles}
                  value={`${s.watchDays}d`}
                  label="Watch time"
                />
                <WrappedStat
                  icon={Heart}
                  value={s.favorites}
                  label="Favorites"
                />
              </div>

              {/* Favorites row */}
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-white/50">
                    Favorite Genre
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {s.favoriteGenre || "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-white/50">
                    Favorite Studio
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {s.favoriteStudio || "—"}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <p className="mt-10 text-center text-xs text-white/40">
                Made with AniVault · anivault.saadasim.me
              </p>
            </div>
          </div>
        </div>
      </div>
      <AlertDialog
        open={showCopiedAlert}
        title="Copied to clipboard"
        message="Your AniVault Wrapped summary is ready to share."
        onClose={() => setShowCopiedAlert(false)}
      />
    </>
  );
}

function WrappedStat({ icon: Icon, value, label, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <Icon
        className={accent ? "h-4 w-4 text-brand" : "h-4 w-4 text-white/60"}
      />
      <p className="mt-2 text-3xl font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-white/50">
        {label}
      </p>
    </div>
  );
}
