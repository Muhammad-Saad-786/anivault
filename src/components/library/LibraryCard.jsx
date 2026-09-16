import { Link } from "react-router-dom";
import { Play, MoreVertical, Heart } from "lucide-react";
import { cn, formatScore } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProgress, toggleFavorite } from "@/lib/api/library";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import ProgressControl from "./ProgressControl";
import EditEntryDialog from "./EditEntryDialog";

export default function LibraryCard({ entry }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);

  const anime = entry.anime;
  if (!anime) return null;

  const title = anime.title_en || anime.title_romaji || "Untitled";
  const totalEpisodes = anime.episodes || 0;
  const progress = entry.progress || 0;
  const pct = totalEpisodes
    ? Math.min(100, (progress / totalEpisodes) * 100)
    : 0;

  const progressMutation = useMutation({
    mutationFn: (next) => updateProgress(user.id, anime.id, next),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library"] }),
  });

  const favMutation = useMutation({
    mutationFn: (next) => toggleFavorite(user.id, { mal_id: anime.id }, next),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library"] }),
  });

  const bump = (delta) => {
    const next = Math.max(
      0,
      Math.min(totalEpisodes || Infinity, progress + delta),
    );
    progressMutation.mutate(next);
  };

  return (
    <div className="card group flex gap-3 p-3">
      <Link to={`/anime/${anime.id}`} className="shrink-0">
        <img
          src={anime.poster_url}
          alt={title}
          className="h-32 w-24 rounded-md object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/anime/${anime.id}`}
            className="line-clamp-2 text-sm font-semibold hover:text-brand"
          >
            {title}
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => favMutation.mutate(!entry.is_favorite)}
              className="rounded-md p-1 hover:bg-surface-elevated"
            >
              <Heart
                className={cn(
                  "h-3.5 w-3.5",
                  entry.is_favorite
                    ? "fill-status-favorite text-status-favorite"
                    : "text-text-muted",
                )}
              />
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="rounded-md p-1 hover:bg-surface-elevated"
            >
              <MoreVertical className="h-3.5 w-3.5 text-text-muted" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
          {anime.type && <span>{anime.type}</span>}
          {anime.year && <span>• {anime.year}</span>}
          {entry.rating && (
            <span className="ml-auto font-bold text-green-400">
              ★ {formatScore(entry.rating)}
            </span>
          )}
        </div>

        {/* Progress */}
        {entry.status === "watching" && (
          <div className="mt-auto pt-3">
            <ProgressControl
              progress={progress}
              total={totalEpisodes}
              onBump={bump}
              pending={progressMutation.isPending}
            />
          </div>
        )}

        {entry.status === "completed" && totalEpisodes > 0 && (
          <div className="mt-auto pt-2 text-xs text-status-completed">
            ✓ Completed {totalEpisodes} episodes
          </div>
        )}
      </div>

      {showEdit && (
        <EditEntryDialog entry={entry} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
}
