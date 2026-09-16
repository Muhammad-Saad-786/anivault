import { Link } from "react-router-dom";
import { ChevronRight, RefreshCw } from "lucide-react";
import AnimeCard from "./AnimeCard";
import AnimeCardSkeleton from "./AnimeCardSkeleton";

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
              <div key={a.mal_id} className="w-32 shrink-0 sm:w-40">
                <AnimeCard anime={a} />
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
