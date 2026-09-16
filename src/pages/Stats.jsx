// src/pages/Stats.jsx
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Sparkles, Award, Clock, Star, Tv, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUserStats } from "@/lib/api/stats";
import Spinner from "@/components/ui/Spinner";
import AnimeCard from "@/components/anime/AnimeCard";
import { cn, formatCount } from "@/lib/utils";

const GENRE_COLORS = [
  "#f60200",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#8b5cf6",
];

export default function Stats() {
  const { user } = useAuth();
  const { data: s, isLoading } = useQuery({
    queryKey: ["stats", user?.id],
    queryFn: () => getUserStats(user.id),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!s || s.total === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-xl font-bold">No stats yet</p>
        <p className="mt-2 text-sm text-text-secondary">
          Add anime to your library to unlock stats.
        </p>
        <Link to="/search" className="btn-brand mt-4">
          Browse anime
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">Your Anime Stats</h1>
          <p className="text-sm text-text-secondary">
            Everything you've tracked on AniVault
          </p>
        </div>
        <Link to="/wrapped" className="btn-brand w-fit">
          <Sparkles className="h-4 w-4" /> See your Wrapped
        </Link>
      </div>

      {/* Big numbers */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <BigStat
          label="Completed"
          value={s.completed}
          icon={Tv}
          color="text-status-completed"
        />
        <BigStat
          label="Episodes"
          value={formatCount(s.episodesWatched)}
          icon={Clock}
          color="text-brand"
        />
        <BigStat
          label="Watch Time"
          value={`${s.watchDays}d`}
          icon={Clock}
          color="text-status-watching"
        />
        <BigStat
          label="Favorites"
          value={s.favorites}
          icon={Heart}
          color="text-status-favorite"
        />
        <BigStat
          label="Avg Rating"
          value={s.avgRating || "—"}
          icon={Star}
          color="text-amber-400"
        />
        <BigStat
          label="This Year"
          value={s.thisYearCompleted}
          icon={Award}
          color="text-purple-400"
        />
      </div>

      {/* Two-column charts */}
      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        {/* Genre pie */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-muted">
            Top Genres
          </h3>
          {s.genreBreakdown.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-secondary">
              No genre data yet
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={s.genreBreakdown.slice(0, 6)}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {s.genreBreakdown.slice(0, 6).map((_, i) => (
                        <Cell
                          key={i}
                          fill={GENRE_COLORS[i % GENRE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#1f1f1f",
                        border: "1px solid #262626",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <ul className="space-y-2 self-center text-sm">
                {s.genreBreakdown.slice(0, 6).map((g, i) => (
                  <li key={g.name} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        background: GENRE_COLORS[i % GENRE_COLORS.length],
                      }}
                    />
                    <span className="flex-1 truncate text-text-secondary">
                      {g.name}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {g.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Studio bar */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-muted">
            Top Studios
          </h3>
          {s.studioBreakdown.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-secondary">
              No studio data yet
            </p>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={s.studioBreakdown}
                  layout="vertical"
                  margin={{ left: 80, right: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#262626"
                    horizontal={false}
                  />
                  <XAxis type="number" stroke="#6b6b6b" fontSize={11} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#a3a3a3"
                    fontSize={11}
                    width={80}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1f1f1f",
                      border: "1px solid #262626",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="#f60200" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Monthly completions */}
      <div className="mb-10 card p-5">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-muted">
          Completions This Year
        </h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={s.monthlyCompletions}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#262626"
                vertical={false}
              />
              <XAxis dataKey="month" stroke="#6b6b6b" fontSize={11} />
              <YAxis stroke="#6b6b6b" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#1f1f1f",
                  border: "1px solid #262626",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="#f60200" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top rated */}
      {s.topRated.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold sm:text-xl">Your Top Rated</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {s.topRated.map((a) => (
              <div key={a.id} className="relative">
                <AnimeCard
                  anime={{
                    mal_id: a.id,
                    title: a.title_en || a.title_romaji,
                    title_english: a.title_en,
                    images: { jpg: { large_image_url: a.poster_url } },
                    episodes: a.episodes,
                    type: a.type,
                    year: a.year,
                    score: a.score,
                  }}
                />
                <div className="absolute -right-1 -top-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white shadow-glow">
                  ★ {a.userRating}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BigStat({ label, value, icon: Icon, color }) {
  return (
    <div className="card p-4">
      <Icon className={cn("h-4 w-4", color)} />
      <p className="mt-2 text-xl font-black sm:text-2xl">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-text-muted">
        {label}
      </p>
    </div>
  );
}
