// src/components/dashboard/ContinueWatchingCard.jsx
import { Link } from "react-router-dom";
import { Play } from "lucide-react";

export default function ContinueWatchingCard({ anime }) {
  const title =
    anime.title_en || anime.title_romaji || anime.title || "Untitled";
  const progress = anime.progress || 0;
  const total = anime.totalEpisodes || anime.episodes || 0;
  const next = anime.nextEpisode || progress + 1;
  const pct = total ? Math.min(100, (progress / total) * 100) : 0;

  // Stream link uses anime.id (which is the mal_id in our cache) — the Watch page
  // will re-resolve the streaming source.
  const watchHref = `/watch/${anime.id}/${next}`;

  return (
    <div className="card group overflow-hidden">
      <div className="relative aspect-video overflow-hidden">
        <img
          src={anime.poster_url}
          alt={title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

        <Link
          to={watchHref}
          className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100"
        >
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand shadow-glow">
            <Play className="h-6 w-6 fill-white text-white" />
          </div>
        </Link>

        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="line-clamp-1 text-sm font-bold text-white">{title}</h3>
          <p className="mt-0.5 text-xs text-white/70">
            Episode {next}
            {total ? ` of ${total}` : ""}
          </p>
        </div>
      </div>

      <div className="h-1 overflow-hidden bg-border-dark">
        <div
          className="h-full bg-brand transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between p-3">
        <span className="text-xs text-text-secondary tabular-nums">
          {progress} / {total || "?"}
        </span>
        <Link
          to={watchHref}
          className="text-xs font-semibold text-brand hover:underline"
        >
          Continue →
        </Link>
      </div>
    </div>
  );
}
