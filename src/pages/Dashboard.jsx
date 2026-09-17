// src/pages/Dashboard.jsx
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Sparkles,
  TrendingUp,
  Calendar,
  Heart,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserStats,
  getContinueWatching,
  getRecentlyAdded,
  getFavorites,
  getUpcomingEpisodes,
} from "@/lib/api/stats";
import { getTrendingAnime } from "@/lib/api/anilist";
import AnimeCard from "@/components/anime/AnimeCard";
import AnimeRow from "@/components/anime/AnimeRow";
import Spinner from "@/components/ui/Spinner";
import ContinueWatchingCard from "@/components/dashboard/ContinueWatchingCard";
import UpcomingList from "@/components/dashboard/UpcomingList";
import { cn, formatCount } from "@/lib/utils";
import SEO from "@/components/SEO";

export default function Dashboard() {
  const { user, profile } = useAuth();

  const stats = useQuery({
    queryKey: ["stats", user?.id],
    queryFn: () => getUserStats(user.id),
    enabled: !!user,
  });

  const continueW = useQuery({
    queryKey: ["dashboard", "continue", user?.id],
    queryFn: () => getContinueWatching(user.id, 12),
    enabled: !!user,
  });

  const recent = useQuery({
    queryKey: ["dashboard", "recent", user?.id],
    queryFn: () => getRecentlyAdded(user.id, 12),
    enabled: !!user,
  });

  const favorites = useQuery({
    queryKey: ["dashboard", "favorites", user?.id],
    queryFn: () => getFavorites(user.id, 12),
    enabled: !!user,
  });

  const upcoming = useQuery({
    queryKey: ["dashboard", "upcoming", user?.id],
    queryFn: () => getUpcomingEpisodes(user.id, 14),
    enabled: !!user,
  });

  const forYou = useQuery({
    queryKey: [
      "dashboard",
      "forYou",
      stats.data?.favoriteGenre,
      stats.data?.favoriteStudio,
    ],
    queryFn: async () => {
      const genre = stats.data?.favoriteGenre;
      const { searchAnimeAniList } = await import("@/lib/api/anilist");

      // If user has a favorite genre, use it. Else fall back to trending.
      if (genre) {
        const { data } = await searchAnimeAniList({
          genres: [genre],
          sort: "score",
          perPage: 12,
        });
        return (data || []).filter(
          (a) => !stats.data?.topRated?.some((t) => t.id === a.mal_id),
        );
      }

      const { getTrendingAnime } = await import("@/lib/api/anilist");
      return (await getTrendingAnime(1, 12)) || [];
    },
    enabled: !!user && !!stats.data,
  });

  if (!user) return null;

  const s = stats.data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SEO
        title="Your Dashboard"
        description="Review your anime activity, continue watching, and personalized recommendations."
      />
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-text-secondary">
            Welcome back,{" "}
            <span className="font-semibold text-text-primary">
              {profile?.display_name || profile?.username || "friend"}
            </span>
          </p>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">
            Your Dashboard
          </h1>
        </div>

        <Link to="/stats" className="btn-brand w-fit">
          <Sparkles className="h-4 w-4" /> View full stats
        </Link>
      </div>

      {/* Quick stats strip */}
      {s && (
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Anime Completed"
            value={s.completed}
            accent="text-status-completed"
          />
          <StatCard
            label="Episodes Watched"
            value={formatCount(s.episodesWatched)}
            accent="text-brand"
          />
          <StatCard
            label="Watch Time"
            value={`${s.watchDays}d`}
            accent="text-status-watching"
          />
          <StatCard
            label="Favorites"
            value={s.favorites}
            accent="text-status-favorite"
          />
        </div>
      )}

      {/* Continue Watching */}
      {continueW.data && continueW.data.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold sm:text-xl">
                Continue Watching
              </h2>
              <p className="text-xs text-text-secondary">
                Pick up where you left off
              </p>
            </div>
            <Link
              to="/library"
              className="text-xs font-semibold text-text-secondary hover:text-brand"
            >
              My Library →
            </Link>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
            <div className="flex gap-4">
              {continueW.data.map((a) => (
                <div key={a.id} className="w-64 shrink-0 sm:w-72">
                  <ContinueWatchingCard anime={a} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {continueW.data && continueW.data.length === 0 && s?.total === 0 && (
        <div className="card mb-10 p-10 text-center">
          <p className="text-lg font-semibold">Your vault is empty</p>
          <p className="mt-1 text-sm text-text-secondary">
            Start by adding some anime to your library.
          </p>
          <Link to="/search" className="btn-brand mt-4">
            <Plus className="h-4 w-4" /> Browse anime
          </Link>
        </div>
      )}

      {/* Upcoming Episodes */}
      {upcoming.data && upcoming.data.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
                <Calendar className="h-5 w-5 text-brand" /> Upcoming Episodes
              </h2>
              <p className="text-xs text-text-secondary">
                Next 14 days from your watching list
              </p>
            </div>
          </div>
          <UpcomingList items={upcoming.data} />
        </section>
      )}

      {/* Recently Added */}
      <div className="mb-10">
        <AnimeRow
          title="Recently Added to Library"
          items={recent.data}
          loading={recent.isLoading}
          viewAllHref="/library"
        />
      </div>

      {/* Favorites */}
      {favorites.data && favorites.data.length > 0 && (
        <div className="mb-10">
          <AnimeRow
            title="Your Favorites"
            items={favorites.data}
            loading={favorites.isLoading}
            viewAllHref="/library?tab=favorites"
          />
        </div>
      )}

      {/* For You */}
      <div className="mb-10">
        <AnimeRow
          title="Recommended For You"
          items={forYou.data}
          loading={forYou.isLoading}
          viewAllHref="/search"
        />
      </div>

      {stats.isLoading && (
        <div className="grid place-items-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className={cn("mt-1 text-2xl font-black", accent)}>{value}</p>
    </div>
  );
}
