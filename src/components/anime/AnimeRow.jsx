import { Link } from "react-router-dom";
import { ChevronRight, RefreshCw } from "lucide-react";
import AnimeCard from "./AnimeCard";
import AnimeCardSkeleton from "./AnimeCardSkeleton";

/**
 * Resolve the best unique ID for React keys across all anime shapes:
 *   - Jikan-normalized: `mal_id`
 *   - Raw AniList:      `id`
 *   - Supabase cache:   `id`
 */
function getKey(a) {
  return (
    a.anilist_id || a.mal_id || a.id || Math.random().toString(36).slice(2)
  );
}

export default function AnimeRow({
  title,
  items,
  loading,
  error,
  onRetry,
  viewAllHref,
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {viewAllHref && (
          <Link
            to={viewAllHref}
            className="flex items-center gap-1 text-xs font-semibold text-text-secondary transition hover:text-brand"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        <div className="flex gap-3 sm:gap-4">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-32 shrink-0 sm:w-40">
                <AnimeCardSkeleton />
              </div>
            ))}

          {!loading && error && (
            <div className="flex w-full flex-col items-start gap-2 py-6 text-sm text-text-secondary">
              <p>Couldn't load this row.</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="btn-ghost !py-1.5 !text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Retry
                </button>
              )}
            </div>
          )}

          {!loading &&
            !error &&
            items?.map((a) => (
              <div key={getKey(a)} className="w-32 shrink-0 sm:w-40">
                <AnimeCard anime={a} />
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
