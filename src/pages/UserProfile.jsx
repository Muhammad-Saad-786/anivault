// src/pages/UserProfile.jsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, Star, Tv, Award, Calendar, Users, List } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { getUserStats } from "@/lib/api/stats";
import { getUserReviews } from "@/lib/api/reviews";
import { getPublicLists } from "@/lib/api/lists";
import { getFollowers, getFollowing } from "@/lib/api/follows";
import { computeCompatibility } from "@/lib/api/social";
import { getFavorites } from "@/lib/api/stats";
import FollowButton from "@/components/profile/FollowButton";
import AnimeCard from "@/components/anime/AnimeCard";
import Spinner from "@/components/ui/Spinner";
import { cn, formatCount } from "@/lib/utils";
import SEO from "@/components/SEO";

export default function UserProfile() {
  const { username } = useParams();
  const { user: me } = useAuth();

  const profile = useQuery({
    queryKey: ["profile-by-username", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const userId = profile.data?.id;

  const stats = useQuery({
    queryKey: ["stats", userId],
    queryFn: () => getUserStats(userId),
    enabled: !!userId,
  });

  const favorites = useQuery({
    queryKey: ["profile-favorites", userId],
    queryFn: () => getFavorites(userId, 12),
    enabled: !!userId,
  });

  const reviews = useQuery({
    queryKey: ["profile-reviews", userId],
    queryFn: () => getUserReviews(userId, { limit: 6 }),
    enabled: !!userId,
  });

  const lists = useQuery({
    queryKey: ["profile-lists", userId],
    queryFn: () => getPublicLists(userId, 6),
    enabled: !!userId,
  });

  const followers = useQuery({
    queryKey: ["followers", userId],
    queryFn: () => getFollowers(userId),
    enabled: !!userId,
  });

  const following = useQuery({
    queryKey: ["following-list", userId],
    queryFn: () => getFollowing(userId),
    enabled: !!userId,
  });

  const compatibility = useQuery({
    queryKey: ["compatibility", me?.id, userId],
    queryFn: () => computeCompatibility(me.id, userId),
    enabled: !!me && !!userId && me.id !== userId,
  });

  if (profile.isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!profile.data) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg font-semibold">User not found</p>
        <Link to="/" className="btn-brand mt-4">
          Back home
        </Link>
      </div>
    );
  }

  const p = profile.data;
  const s = stats.data;
  const initial = (p.username || "U")[0].toUpperCase();
  const isMe = me?.id === p.id;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <SEO
        title={`${p.display_name || p.username}'s Profile`}
        description={
          p.bio ||
          `View ${p.display_name || p.username}'s anime profile on AniVault.`
        }
        image={p.avatar_url}
        url={`${window.location.origin}/u/${username}`}
      />
      {/* Header */}
      <div className="card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-brand/40 via-brand/20 to-transparent" />
        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {p.avatar_url ? (
                <img
                  src={p.avatar_url}
                  alt=""
                  className="h-24 w-24 rounded-full border-4 border-surface-card object-cover"
                />
              ) : (
                <span className="grid h-24 w-24 place-items-center rounded-full border-4 border-surface-card bg-brand text-3xl font-black text-white">
                  {initial}
                </span>
              )}
              <div className="pb-1">
                <h1 className="text-2xl font-black sm:text-3xl">
                  {p.display_name || p.username}
                </h1>
                <p className="text-sm text-text-secondary">@{p.username}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {isMe ? (
                <Link to="/library" className="btn-ghost">
                  My Library
                </Link>
              ) : (
                <FollowButton targetUserId={p.id} />
              )}
            </div>
          </div>

          {p.bio && (
            <p className="mt-4 max-w-2xl text-sm text-text-secondary">
              {p.bio}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <strong className="text-text-primary">
                {followers.data?.length ?? 0}
              </strong>{" "}
              followers
            </span>
            <span className="flex items-center gap-1">
              <strong className="text-text-primary">
                {following.data?.length ?? 0}
              </strong>{" "}
              following
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Joined{" "}
              {new Date(p.created_at).toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Compatibility score */}
          {compatibility.data != null && compatibility.data > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-xs font-semibold text-brand">
              <Heart className="h-3.5 w-3.5 fill-brand" />
              You and {p.display_name || p.username} are {compatibility.data}%
              compatible
            </div>
          )}
        </div>
      </div>

      {/* Stats strip */}
      {s && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Completed" value={s.completed} icon={Tv} />
          <MiniStat
            label="Episodes"
            value={formatCount(s.episodesWatched)}
            icon={Star}
          />
          <MiniStat label="Watch Time" value={`${s.watchDays}d`} icon={Award} />
          <MiniStat label="Favorites" value={s.favorites} icon={Heart} />
        </div>
      )}

      {/* Favorites */}
      {favorites.data && favorites.data.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold">Favorites</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {favorites.data.map((a) => (
              <AnimeCard key={a.id} anime={a} />
            ))}
          </div>
        </section>
      )}

      {/* Public lists */}
      {lists.data && lists.data.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-lg font-bold">Public Lists</h2>
            <span className="text-xs text-text-muted">
              {lists.data.length} {lists.data.length === 1 ? "list" : "lists"}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lists.data.map((l) => (
              <Link
                key={l.id}
                to={`/lists/${l.id}`}
                className="card group overflow-hidden transition hover:border-brand/40"
              >
                <div className="flex">
                  {/* Cover */}
                  {l.poster_url ? (
                    <img
                      src={l.poster_url}
                      alt=""
                      className="h-24 w-16 shrink-0 object-cover"
                    />
                  ) : (
                    <div className="grid h-24 w-16 shrink-0 place-items-center bg-surface-elevated text-text-muted">
                      <List className="h-6 w-6" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1 p-3">
                    <h3 className="line-clamp-1 text-sm font-bold">{l.name}</h3>
                    {l.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
                        {l.description}
                      </p>
                    )}
                    <p className="mt-2 text-[11px] font-semibold text-text-muted">
                      {l.item_count} {l.item_count === 1 ? "anime" : "anime"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent reviews */}
      {reviews.data && reviews.data.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold">Recent Reviews</h2>
          <div className="space-y-3">
            {reviews.data.map((r) => (
              <Link
                key={r.id}
                to={`/anime/${r.anime.id}`}
                className="card flex items-start gap-4 p-4 transition hover:border-brand/40"
              >
                <img
                  src={r.anime.poster_url}
                  alt=""
                  className="h-20 w-14 shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold">
                    {r.anime.title_en || r.anime.title_romaji}
                  </p>
                  {r.rating > 0 && (
                    <p className="mt-0.5 text-xs font-bold text-green-400">
                      ★ {r.rating}
                    </p>
                  )}
                  <p className="mt-1 line-clamp-3 text-xs text-text-secondary">
                    {r.body}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MiniStat({ label, value, icon: Icon }) {
  return (
    <div className="card p-4">
      <Icon className="h-4 w-4 text-brand" />
      <p className="mt-2 text-xl font-black">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-text-muted">
        {label}
      </p>
    </div>
  );
}
