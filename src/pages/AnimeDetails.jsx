// src/pages/AnimeDetails.jsx
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Star,
  Calendar,
  Clock,
  Tv,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  getAnimeByIdAniList as getAnimeById,
  getRecommendationsAniList as getAnimeRecommendations,
  getSimilarByGenreAniList,
  getTrendingAnime,
} from "@/lib/api/anilist";
import { formatScore, formatCount, cn } from "@/lib/utils";
import AnimeGrid from "@/components/anime/AnimeGrid";
import AddToLibrary from "@/components/library/AddToLibrary";
import AIChat from "@/components/ai/AIChat";
import CharactersTab from "@/components/anime/CharactersTab";
import StaffTab from "@/components/anime/StaffTab";
import RelationsTab from "@/components/anime/RelationsTab";
import WatchOrder from "@/components/anime/WatchOrder";
import Spinner from "@/components/ui/Spinner";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "characters", label: "Characters" },
  { value: "staff", label: "Staff" },
  { value: "relations", label: "Relations" },
];

export default function AnimeDetails() {
  const { id } = useParams();
  const [tab, setTab] = useState("overview");
  const [showAllRecs, setShowAllRecs] = useState(false);

  /* Main anime */
  const {
    data: anime,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["anime", id],
    queryFn: () => getAnimeById(id),
    retry: 1,
  });

  /* Recommendations — 3-tier fallback */
  const { data: recs, isLoading: recsLoading } = useQuery({
    queryKey: ["anime", id, "recs"],
    enabled: !!anime?.mal_id,
    retry: 1,
    queryFn: async () => {
      try {
        const list = await getAnimeRecommendations(anime.mal_id);
        if (Array.isArray(list) && list.length > 0) return list;
      } catch {}
      try {
        const list = await getSimilarByGenreAniList(anime.mal_id, 18);
        if (Array.isArray(list) && list.length > 0) return list;
      } catch {}
      try {
        const trending = await getTrendingAnime(1, 18);
        return (trending || []).filter((m) => m.mal_id !== anime.mal_id);
      } catch {
        return [];
      }
    },
  });

  /* Loading */
  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-7xl place-items-center px-4 py-24 sm:px-6 lg:px-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  /* Error */
  if (isError) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg font-semibold">Couldn't load this anime</p>
        <p className="mt-2 text-sm text-text-secondary">
          The anime database didn't respond. Try again in a moment.
        </p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-brand mt-4"
        >
          <RefreshCw
            className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
          />
          Retry
        </button>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-lg">Anime not found.</p>
        <Link to="/search" className="btn-brand mt-4">
          Back to browse
        </Link>
      </div>
    );
  }

  /* Derived */
  const poster =
    anime.images?.webp?.large_image_url ||
    anime.images?.jpg?.large_image_url ||
    anime.images?.jpg?.image_url;
  const banner = anime.banner_url || poster;
  const title = anime.title_english || anime.title || anime.title_romaji;

  const recItems = Array.isArray(recs) ? recs : [];
  const visibleRecs = showAllRecs ? recItems : recItems.slice(0, 12);

  return (
    <div>
      {/* Banner */}
      <div className="relative h-56 w-full overflow-hidden bg-surface-darker sm:h-72 lg:h-80">
        <img
          src={banner}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-darker via-surface-darker/40 to-transparent" />
      </div>

      {/* Header block */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-20 flex flex-col gap-6 sm:-mt-28 sm:flex-row sm:gap-8">
          <img
            src={poster}
            alt={title}
            className="h-56 sm:w-40 shrink-0 rounded-card border border-border-dark object-cover shadow-card sm:h-72 sm:w-52 mt-30"
          />

          <div className="min-w-0 flex-1 pt-2 sm:pt-20 mt-10">
            <h1 className="break-words text-2xl font-black leading-tight sm:text-4xl">
              {title}
            </h1>
            {anime.title_japanese && (
              <p className="mt-1 text-sm text-text-secondary">
                {anime.title_japanese}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary">
              {anime.score != null && (
                <span className="flex items-center gap-1 font-bold text-green-400">
                  <Star className="h-4 w-4 fill-current" />
                  {formatScore(anime.score)}
                  {anime.scored_by != null && (
                    <span className="font-normal text-text-muted">
                      ({formatCount(anime.scored_by)})
                    </span>
                  )}
                </span>
              )}
              {anime.type && (
                <span className="flex items-center gap-1">
                  <Tv className="h-3.5 w-3.5" /> {anime.type}
                </span>
              )}
              {anime.episodes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {anime.episodes} ep
                </span>
              )}
              {anime.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> {anime.year}
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="btn-brand !px-6 !py-2.5">
                to={`/watch/${anime.anilist_id || anime.mal_id}`}
                <Play className="h-4 w-4 fill-white" /> Watch
              </Link>
              <AddToLibrary anime={anime} />
            </div>

            {anime.synopsis && (
              <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                {anime.synopsis}
              </p>
            )}
          </div>
        </div>

        {/* Meta grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetaCard label="Status" value={prettyStatus(anime.status)} />
          <MetaCard label="Source" value={anime.source} />
          <MetaCard label="Rating" value={anime.rating} />
          <MetaCard
            label="Studio"
            value={
              anime.studios?.[0] ? (
                <Link
                  to={`/studio/${anime.studios[0].mal_id}`}
                  className="text-brand hover:underline"
                >
                  {anime.studios[0].name}
                </Link>
              ) : (
                "—"
              )
            }
          />{" "}
        </div>

        {/* Genres */}
        {[...(anime.genres || []), ...(anime.themes || [])].length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {[...(anime.genres || []), ...(anime.themes || [])].map((g) => (
              <span
                key={`${g.mal_id}-${g.name}`}
                className="rounded-full border border-border-dark bg-surface-card px-3 py-1 text-xs font-medium text-text-secondary"
              >
                {g.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ===== TABS ===== */}
      <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border-dark">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition",
                tab === t.value
                  ? "border-brand text-text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          <div className="space-y-10">
            {/* Watch order widget */}
            <WatchOrder anime={anime} />

            {/* AI chat */}
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold sm:text-xl">
                <Sparkles className="h-5 w-5 text-brand" /> Ask AI about this
                anime
              </h2>
              <AIChat anime={anime} />
            </div>

            {/* Recommendations */}
            <div>
              <div className="mb-4 flex items-end justify-between">
                <h2 className="text-lg font-bold sm:text-xl">
                  You might also like
                </h2>
                {recItems.length > 12 && (
                  <span className="text-xs text-text-secondary">
                    {recItems.length} titles
                  </span>
                )}
              </div>

              {recsLoading && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[2/3] animate-pulse rounded-card bg-surface-card"
                    />
                  ))}
                </div>
              )}

              {!recsLoading && recItems.length === 0 && (
                <div className="card p-8 text-center text-sm text-text-secondary">
                  No recommendations available yet.
                </div>
              )}

              {!recsLoading && recItems.length > 0 && (
                <>
                  <AnimeGrid items={visibleRecs} />
                  {recItems.length > 12 && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={() => setShowAllRecs((v) => !v)}
                        className="btn-ghost"
                      >
                        {showAllRecs
                          ? "Show less"
                          : `Show all ${recItems.length}`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {tab === "characters" && <CharactersTab animeId={anime.anilist_id} />}
        {tab === "staff" && <StaffTab animeId={anime.anilist_id} />}
        {tab === "relations" && <RelationsTab anime={anime} />}
      </div>
    </div>
  );
}

function MetaCard({ label, value }) {
  return (
    <div className="card p-3">
      <p className="text-xs uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value || "—"}</p>
    </div>
  );
}

function prettyStatus(s) {
  if (!s) return null;
  const map = {
    RELEASING: "Airing",
    FINISHED: "Finished",
    NOT_YET_RELEASED: "Upcoming",
    CANCELLED: "Cancelled",
    HIATUS: "Hiatus",
  };
  return map[s] || s;
}
