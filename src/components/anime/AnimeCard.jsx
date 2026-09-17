// src/components/anime/AnimeCard.jsx
import { Link, useNavigate } from "react-router-dom";
import { Play, Plus } from "lucide-react";
import ScoreBadge from "./ScoreBadge";
import { cn } from "@/lib/utils";
import SmartImage from "@/components/ui/SmartImage";
/* ---------- Fallback poster ---------- */
const FALLBACK_POSTER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450"><rect width="300" height="450" fill="#1f1f1f"/><text x="150" y="225" text-anchor="middle" fill="#6b6b6b" font-family="sans-serif" font-size="16">No Image</text></svg>`,
  );

/* ---------- Shape resolvers ---------- */

/** Resolve a title from any of our known shapes. */
function resolveTitle(a) {
  return (
    a.title_english ||
    a.title_en ||
    a.title?.english ||
    a.title?.romaji ||
    a.title_romaji ||
    a.title ||
    "Untitled"
  );
}

/** Resolve the best available poster URL. */
function resolvePoster(a) {
  return (
    // Jikan-normalized
    a.images?.webp?.large_image_url ||
    a.images?.jpg?.large_image_url ||
    a.images?.jpg?.image_url ||
    // Raw AniList
    a.coverImage?.extraLarge ||
    a.coverImage?.large ||
    a.coverImage?.medium ||
    // Supabase cache
    a.poster_url ||
    null
  );
}

/** Resolve a numeric score on a 0–10 scale. */
function resolveScore(a) {
  // Already 0-10 (Jikan)
  if (typeof a.score === "number") return a.score;
  // Raw AniList is 0-100
  if (typeof a.averageScore === "number") return a.averageScore / 10;
  if (typeof a.meanScore === "number") return a.meanScore / 10;
  return null;
}

/** Resolve episode count. */
function resolveEpisodes(a) {
  return a.episodes ?? null;
}

/** Resolve type/format. */
function resolveType(a) {
  return a.type || a.format || "";
}

/** Resolve year. */
function resolveYear(a) {
  return a.year || a.seasonYear || a.startDate?.year || null;
}

/** Resolve the "airing" flag across shapes. */
function resolveAiring(a) {
  if (typeof a.airing === "boolean") return a.airing;
  if (a.status === "RELEASING") return true;
  if (typeof a.status === "string" && a.status.toLowerCase() === "airing")
    return true;
  return false;
}

/** Resolve the best ID for routing. */
function resolveId(a) {
  return a.anilist_id || a.id || a.mal_id;
}

/* ---------- Component ---------- */

export default function AnimeCard({ anime, className }) {
  const navigate = useNavigate();
  if (!anime) return null;

  const id = resolveId(anime);
  const title = resolveTitle(anime);
  const poster = resolvePoster(anime);
  const score = resolveScore(anime);
  const type = resolveType(anime);
  const episodes = resolveEpisodes(anime);
  const airing = resolveAiring(anime);

  const metaEpisodes = episodes ? `${episodes} ep` : "";

  const goToWatch = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    navigate(`/watch/${id}/1`);
  };

  const goToAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/anime/${id}`);
  };

  return (
    <Link
      to={`/anime/${id}`}
      className={cn(
        "group relative block overflow-hidden rounded-card border border-border-dark bg-surface-card transition hover:border-brand/60 hover:shadow-glow",
        className,
      )}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <SmartImage
          src={poster}
          alt={title}
          aspect="absolute inset-0"
          wrapperClassName="absolute inset-0"
          className="group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-90" />

        {/* Top-left badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {airing && (
            <span className="badge-red !text-[10px] !py-0.5">AIRING</span>
          )}
        </div>

        {/* Score badge (top-right) */}
        <div className="absolute right-2 top-2">
          <ScoreBadge score={score} />
        </div>

        {/* Hover action buttons */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={goToWatch}
              className="grid h-11 w-11 place-items-center rounded-full bg-brand text-white shadow-glow transition hover:bg-brand-hover"
              aria-label="Watch now"
            >
              <Play className="h-5 w-5 fill-white" />
            </button>
            <button
              type="button"
              onClick={goToAdd}
              className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
              aria-label="Add to list"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">
            {type && <span>{type}</span>}
            {type && metaEpisodes && <span>•</span>}
            {metaEpisodes && <span>{metaEpisodes}</span>}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white">
            {title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
