import { Link } from "react-router-dom";
import { Play, Plus } from "lucide-react";
import ScoreBadge from "./ScoreBadge";
import { cn } from "@/lib/utils";

export default function AnimeCard({ anime, className }) {
  if (!anime) return null;

  const title =
    anime.title_english || anime.title || anime.title_romaji || "Untitled";
  const poster =
    anime.images?.webp?.large_image_url ||
    anime.images?.jpg?.large_image_url ||
    anime.images?.jpg?.image_url;
  const type = anime.type || "";
  const episodes = anime.episodes ? `${anime.episodes} ep` : "";

  return (
    <Link
      to={`/anime/${anime.mal_id}`}
      className={cn(
        "group relative block overflow-hidden rounded-card border border-border-dark bg-surface-card transition hover:border-brand/60 hover:shadow-glow",
        className,
      )}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={poster}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-90" />

        {/* Top badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {anime.airing && (
            <span className="badge-red !text-[10px] !py-0.5">AIRING</span>
          )}
        </div>
        <div className="absolute right-2 top-2">
          <ScoreBadge score={anime.score} />
        </div>

        {/* Hover action */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="grid h-11 w-11 place-items-center rounded-full bg-brand text-white shadow-glow transition hover:bg-brand-hover"
              aria-label="Watch"
            >
              <Play className="h-5 w-5 fill-white" />
            </button>
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
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
            {type && episodes && <span>•</span>}
            {episodes && <span>{episodes}</span>}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white">
            {title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
