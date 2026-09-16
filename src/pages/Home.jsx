import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Play, Info, TrendingUp, RefreshCw } from "lucide-react";
import {
  getTrendingAnime,
  getTopAnimeAniList,
  getSeasonalAniList,
} from "@/lib/api/anilist";
import { getSeasonContext, formatScore } from "@/lib/utils";
import AnimeRow from "@/components/anime/AnimeRow";

export default function Home() {
  const { season, year } = getSeasonContext();

  const trending = useQuery({
    queryKey: ["home", "trending"],
    queryFn: () => getTrendingAnime(1, 20),
  });

  const top = useQuery({
    queryKey: ["home", "top"],
    queryFn: () => getTopAnimeAniList(1, 20),
  });

  const seasonal = useQuery({
    queryKey: ["home", "seasonal", year, season],
    queryFn: () => getSeasonalAniList(season, year, 1, 20),
  });

  const hero = trending.data?.[0];
  const heroImg =
    hero?.images?.webp?.large_image_url ||
    hero?.images?.jpg?.large_image_url ||
    hero?.images?.jpg?.image_url;

  const allFailed = trending.isError && top.isError && seasonal.isError;

  return (
    <div className="pb-10">
      {/* HERO */}
      {hero && (
        <section className="relative h-[420px] w-full overflow-hidden sm:h-[500px]">
          <img
            src={heroImg}
            alt={hero.title}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-darker via-surface-darker/70 to-surface-darker/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-darker via-transparent to-transparent" />

          <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-10 sm:px-6 lg:px-8">
            <span className="badge-red mb-3 w-fit">
              <TrendingUp className="h-3 w-3" /> #1 Trending Now
            </span>
            <h1 className="max-w-2xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              {hero.title_english || hero.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              {hero.score != null && (
                <span className="font-bold text-green-400">
                  ★ {formatScore(hero.score)}
                </span>
              )}
              {hero.type && <span>{hero.type}</span>}
              {hero.episodes && <span>{hero.episodes} episodes</span>}
              {hero.status && <span>• {hero.status}</span>}
            </div>
            <p className="mt-3 line-clamp-2 max-w-2xl text-sm text-text-secondary sm:line-clamp-3 sm:text-base">
              {hero.synopsis}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={`/anime/${hero.mal_id}`}
                className="btn-brand !px-6 !py-2.5"
              >
                <Play className="h-4 w-4 fill-white" /> Watch now
              </Link>
              <Link
                to={`/anime/${hero.mal_id}`}
                className="btn-ghost !px-6 !py-2.5"
              >
                <Info className="h-4 w-4" /> More info
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Error banner */}
      {allFailed && (
        <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="card flex flex-col items-center gap-3 p-8 text-center">
            <p className="font-semibold">Couldn't load anime right now</p>
            <p className="text-sm text-text-secondary">
              The anime data source is temporarily unavailable. Try again in a
              moment.
            </p>
            <button
              onClick={() => {
                trending.refetch();
                top.refetch();
                seasonal.refetch();
              }}
              className="btn-brand"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        </div>
      )}

      {/* ROWS */}
      <div className="mt-10 space-y-12">
        <AnimeRow
          title="🔥 Trending Now"
          items={trending.data?.slice(0, 12)}
          loading={trending.isLoading}
          error={trending.isError}
          onRetry={() => trending.refetch()}
          viewAllHref="/search?order_by=popularity"
        />

        <AnimeRow
          title={`🌸 ${season[0].toUpperCase() + season.slice(1)} ${year}`}
          items={seasonal.data?.slice(0, 12)}
          loading={seasonal.isLoading}
          error={seasonal.isError}
          onRetry={() => seasonal.refetch()}
          viewAllHref="/seasonal"
        />

        <AnimeRow
          title="⭐ Top Rated of All Time"
          items={top.data?.slice(0, 12)}
          loading={top.isLoading}
          error={top.isError}
          onRetry={() => top.refetch()}
          viewAllHref="/search?order_by=score"
        />
      </div>
    </div>
  );
}
