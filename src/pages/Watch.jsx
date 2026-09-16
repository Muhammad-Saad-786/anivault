// src/pages/Watch.jsx
import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  Languages,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { getAnimeByIdAniList } from "@/lib/api/anilist";
import {
  getEmbedUrl,
  getAllEmbedUrls,
  DEFAULT_PROVIDER,
} from "@/lib/api/streaming";
import { useAuth } from "@/hooks/useAuth";
import { getLibraryEntry, updateProgress } from "@/lib/api/library";
import { cn } from "@/lib/utils";
import Spinner from "@/components/ui/Spinner";

export default function Watch() {
  const { animeId, episode: episodeParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const currentEpisode = Math.max(1, Number(episodeParam) || 1);
  const [lang, setLang] = useState("sub");
  const [providerId, setProviderId] = useState(DEFAULT_PROVIDER);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  /* ---------------- Anime metadata ---------------- */
  const { data: anime, isLoading: animeLoading } = useQuery({
    queryKey: ["anime", animeId],
    queryFn: () => getAnimeByIdAniList(animeId),
  });

  /* ---------------- Library entry (for progress) ---------------- */
  const { data: libraryEntry } = useQuery({
    queryKey: ["library", "entry", user?.id, anime?.mal_id],
    queryFn: () => getLibraryEntry(user.id, anime.mal_id),
    enabled: !!user && !!anime?.mal_id,
  });

  /* ---------------- Compute embed URL ---------------- */
  const anilistId = anime?.anilist_id || anime?.mal_id;

  const embed = useMemo(() => {
    if (!anilistId) return null;
    return getEmbedUrl(anilistId, currentEpisode, lang, providerId);
  }, [anilistId, currentEpisode, lang, providerId]);

  const allEmbeds = useMemo(() => {
    if (!anilistId) return [];
    return getAllEmbedUrls(anilistId, currentEpisode, lang);
  }, [anilistId, currentEpisode, lang]);

  /* ---------------- Auto-update progress ---------------- */
  useEffect(() => {
    if (!user || !anime?.mal_id) return;
    if (libraryEntry && libraryEntry.progress >= currentEpisode) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        await updateProgress(user.id, anime.mal_id, currentEpisode);
        if (!cancelled) {
          qc.invalidateQueries({ queryKey: ["library"] });
        }
      } catch {
        /* silent */
      }
    }, 3000); // wait 3s before marking — gives time for iframe to load

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user, anime, currentEpisode, libraryEntry, qc]);

  /* ---------------- Navigation ---------------- */
  const totalEpisodes = anime?.episodes || 0;
  const hasNext = !totalEpisodes || currentEpisode < totalEpisodes;
  const hasPrev = currentEpisode > 1;

  const goToEpisode = (num) => {
    if (num < 1) return;
    if (totalEpisodes && num > totalEpisodes) return;
    setIframeLoading(true);
    setIframeError(false);
    navigate(`/watch/${animeId}/${num}`, { replace: true });
  };

  /* ---------------- Loading ---------------- */
  if (animeLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg font-semibold">Anime not found</p>
        <Link to="/search" className="btn-brand mt-4">
          Back to browse
        </Link>
      </div>
    );
  }

  const animeTitle =
    anime.title_english || anime.title_romaji || anime.title || "Anime";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/anime/${animeId}`}
          className="flex items-center gap-1 text-sm text-text-secondary transition hover:text-brand"
        >
          <ChevronLeft className="h-4 w-4" /> {animeTitle}
        </Link>

        <div className="flex items-center gap-2">
          {/* Sub / Dub */}
          <div className="flex overflow-hidden rounded-lg border border-border-dark">
            {["sub", "dub"].map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLang(l);
                  setIframeLoading(true);
                  setIframeError(false);
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold uppercase transition",
                  lang === l
                    ? "bg-brand text-white"
                    : "bg-surface-card text-text-secondary hover:bg-surface-elevated",
                )}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Open in new tab */}
          {embed && (
            <a
              href={embed.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost !px-3 !py-1.5 !text-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open</span>
            </a>
          )}
        </div>
      </div>

      {/* Video iframe */}
      <div className="relative aspect-video w-full overflow-hidden rounded-card border border-border-dark bg-black">
        {iframeLoading && !iframeError && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/60">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand" />
              <p className="mt-3 text-sm text-text-secondary">
                Loading episode {currentEpisode}…
              </p>
            </div>
          </div>
        )}

        {iframeError ? (
          <div className="grid h-full place-items-center p-8 text-center">
            <div className="max-w-md">
              <p className="font-semibold text-brand">
                This source didn't load
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Try the other provider below, or switch to{" "}
                {lang === "sub" ? "dub" : "sub"}.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {allEmbeds.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setProviderId(e.id);
                      setIframeLoading(true);
                      setIframeError(false);
                    }}
                    className={cn(
                      "btn-ghost !text-xs",
                      providerId === e.id && "border-brand/60",
                    )}
                  >
                    Try {e.name}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setIframeLoading(true);
                    setIframeError(false);
                    // Force iframe reload
                    setProviderId((p) => p);
                  }}
                  className="btn-brand !text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Retry
                </button>
              </div>
            </div>
          </div>
        ) : (
          embed && (
            <iframe
              key={`${embed.url}-${lang}`}
              src={embed.url}
              className="h-full w-full"
              allowFullScreen
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              onLoad={() => setIframeLoading(false)}
              onError={() => {
                setIframeLoading(false);
                setIframeError(true);
              }}
              title={`${animeTitle} — Episode ${currentEpisode}`}
            />
          )
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToEpisode(currentEpisode - 1)}
            disabled={!hasPrev}
            className="btn-ghost !px-3 !py-2 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          <span className="px-3 text-sm font-semibold">
            Episode {currentEpisode}
            {totalEpisodes > 0 && ` / ${totalEpisodes}`}
          </span>

          <button
            onClick={() => goToEpisode(currentEpisode + 1)}
            disabled={!hasNext}
            className="btn-brand !px-3 !py-2 disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Provider switcher */}
        {allEmbeds.length > 1 && (
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-text-muted" />
            <select
              value={providerId}
              onChange={(e) => {
                setProviderId(e.target.value);
                setIframeLoading(true);
                setIframeError(false);
              }}
              className="input-dark !py-1.5 !text-xs"
            >
              {allEmbeds.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Episode grid */}
      {totalEpisodes > 0 && (
        <div className="mt-6 card p-4">
          <h3 className="mb-3 text-sm font-bold">Episodes · {totalEpisodes}</h3>
          <div className="grid max-h-96 grid-cols-5 gap-2 overflow-y-auto sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
            {Array.from({ length: totalEpisodes }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => goToEpisode(n)}
                className={cn(
                  "rounded-md border px-2 py-2 text-xs font-medium transition",
                  n === currentEpisode
                    ? "border-brand bg-brand text-white"
                    : "border-border-dark bg-surface-dark text-text-secondary hover:border-brand/60 hover:text-text-primary",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className="mt-6 flex items-start gap-2 rounded-lg border border-border-dark bg-surface-card p-3 text-xs text-text-secondary">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
        <p>
          Streaming via{" "}
          <strong className="text-text-primary">{embed?.providerName}</strong>.
          If playback fails, try the other provider or switch language. Content
          hosted by third parties.
        </p>
      </div>
    </div>
  );
}
