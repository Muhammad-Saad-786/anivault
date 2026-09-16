// src/components/dashboard/UpcomingList.jsx
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { formatCount } from "@/lib/utils";

export default function UpcomingList({ items }) {
  return (
    <div className="card divide-y divide-border-dark">
      {items.map((a) => (
        <Link
          key={a.id}
          to={`/anime/${a.id}`}
          className="flex items-center gap-3 p-3 transition hover:bg-surface-elevated"
        >
          <img
            src={a.poster_url}
            alt={a.title_en || a.title_romaji}
            className="h-16 w-11 shrink-0 rounded object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-semibold">
              {a.title_en || a.title_romaji}
            </p>
            <p className="mt-0.5 text-xs text-text-secondary">
              Episode {a.nextEpisode}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="flex items-center gap-1 text-xs font-semibold text-brand">
              <Clock className="h-3 w-3" /> {formatAirsIn(a.airsIn)}
            </p>
            <p className="mt-0.5 text-[10px] text-text-muted">
              {new Date(a.airingAt * 1000).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function formatAirsIn(seconds) {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}
