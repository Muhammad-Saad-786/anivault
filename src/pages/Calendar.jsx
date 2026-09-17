// src/pages/Calendar.jsx
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Play,
  Star,
  Filter,
} from "lucide-react";
import axios from "axios";
import { mapAniListToJikan } from "@/lib/api/anilist";
import { useAuth } from "@/hooks/useAuth";
import { getLibrary } from "@/lib/api/library";
import { cn } from "@/lib/utils";
import Spinner from "@/components/ui/Spinner";
import SEO from "@/components/SEO";

const ANILIST_URL = "https://graphql.anilist.co";

const SCHEDULE_QUERY = `
query ($page: Int, $perPage: Int, $airingAtGreater: Int, $airingAtLesser: Int) {
  Page(page: $page, perPage: $perPage) {
    airingSchedules(
      airingAt_greater: $airingAtGreater
      airingAt_lesser: $airingAtLesser
      sort: TIME
    ) {
      id
      episode
      airingAt
      media {
        id
        idMal
        title { romaji english native }
        coverImage { large extraLarge medium }
        format
        status
        episodes
        averageScore
        genres
        isAdult
      }
    }
  }
}`;

async function fetchSchedule(fromTs, toTs, page = 1, perPage = 100) {
  const { data } = await axios.post(ANILIST_URL, {
    query: SCHEDULE_QUERY,
    variables: {
      page,
      perPage,
      airingAtGreater: Math.floor(fromTs),
      airingAtLesser: Math.floor(toTs),
    },
  });
  if (data?.errors?.length) throw new Error(data.errors[0].message);
  return (data?.data?.Page?.airingSchedules || [])
    .filter((s) => !s.media?.isAdult)
    .map((s) => ({
      id: s.id,
      episode: s.episode,
      airingAt: s.airingAt,
      anime: mapAniListToJikan(s.media),
    }));
}

/* ---------------- Main component ---------------- */

export default function Calendar() {
  const { user } = useAuth();
  const [view, setView] = useState("today"); // today | week | month
  const [weekOffset, setWeekOffset] = useState(0);
  const [filter, setFilter] = useState("all"); // all | library
  const [selectedDay, setSelectedDay] = useState(null);

  /* ---------- Week range ---------- */
  const { startOfWeek, days, todayKey } = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMon = (day + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMon + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });

    return {
      startOfWeek: monday,
      days,
      todayKey: dayKey(new Date()),
    };
  }, [weekOffset]);

  const endOfWeek = useMemo(() => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + 7);
    return d;
  }, [startOfWeek]);

  /* ---------- Fetch schedule ---------- */
  const { data, isLoading, isError } = useQuery({
    queryKey: ["calendar", startOfWeek.toISOString()],
    queryFn: async () => {
      const [p1, p2] = await Promise.all([
        fetchSchedule(
          startOfWeek.getTime() / 1000,
          endOfWeek.getTime() / 1000,
          1,
          100,
        ),
        fetchSchedule(
          startOfWeek.getTime() / 1000,
          endOfWeek.getTime() / 1000,
          2,
          100,
        ),
      ]);
      return [...p1, ...p2];
    },
    staleTime: 10 * 60 * 1000,
  });

  /* ---------- Fetch user's library IDs for filtering ---------- */
  const { data: library } = useQuery({
    queryKey: ["library", "all", user?.id],
    queryFn: () => getLibrary(user.id),
    enabled: !!user,
  });

  const libraryIds = useMemo(() => {
    if (!library) return new Set();
    return new Set(library.map((e) => e.anime_id));
  }, [library]);

  /* ---------- Filter + group ---------- */
  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === "library") {
      return data.filter((item) => libraryIds.has(item.anime.mal_id));
    }
    return data;
  }, [data, filter, libraryIds]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(days.map((d) => [dayKey(d), []]));
    for (const item of filtered) {
      const k = dayKey(new Date(item.airingAt * 1000));
      if (map[k]) map[k].push(item);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.airingAt - b.airingAt);
    }
    return map;
  }, [filtered, days]);

  const todayItems = grouped[todayKey] || [];

  /* ---------- Week navigation ---------- */
  const weekLabel = `${startOfWeek.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} — ${new Date(endOfWeek.getTime() - 1).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SEO
        title="Airing Calendar"
        description="Track upcoming anime episodes with AniVault's airing calendar."
      />
      {/* ============ HEADER ============ */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black sm:text-3xl">
            <CalendarIcon className="h-6 w-6 text-brand" /> Airing Calendar
          </h1>
          <p className="text-sm text-text-secondary">{weekLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter */}
          <button
            onClick={() => setFilter((f) => (f === "all" ? "library" : "all"))}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition",
              filter === "library"
                ? "border-brand bg-brand/10 text-brand"
                : "border-border-dark bg-surface-card text-text-secondary hover:border-brand/60",
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            {filter === "library" ? "My Library" : "All Anime"}
          </button>
        </div>
      </div>

      {/* ============ VIEW TABS ============ */}
      <div className="mb-6 flex gap-1 border-b border-border-dark">
        {[
          { value: "today", label: "Today" },
          { value: "week", label: "This Week" },
          { value: "month", label: "Month" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setView(t.value)}
            className={cn(
              "border-b-2 px-4 py-3 text-sm font-medium transition",
              view === t.value
                ? "border-brand text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ WEEK NAVIGATOR ============ */}
      {view !== "today" && (
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="btn-ghost !px-3"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex flex-1 gap-1 overflow-x-auto">
            {days.map((d) => {
              const k = dayKey(d);
              const isToday = k === todayKey;
              const isSelected = selectedDay === k;
              const count = grouped[k]?.length || 0;

              return (
                <button
                  key={k}
                  onClick={() => setSelectedDay(k)}
                  className={cn(
                    "flex min-w-[64px] flex-1 flex-col items-center gap-0.5 rounded-lg border px-2 py-2.5 transition",
                    isSelected
                      ? "border-brand bg-brand/10"
                      : isToday
                        ? "border-brand/40 bg-brand/5"
                        : "border-border-dark bg-surface-card hover:border-brand/40",
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      isToday ? "text-brand" : "text-text-muted",
                    )}
                  >
                    {d.toLocaleDateString(undefined, { weekday: "short" })}
                  </span>
                  <span
                    className={cn(
                      "text-lg font-black leading-none",
                      isToday ? "text-brand" : "text-text-primary",
                    )}
                  >
                    {d.getDate()}
                  </span>
                  {count > 0 && (
                    <span className="mt-0.5 rounded-full bg-surface-elevated px-1.5 text-[9px] font-semibold text-text-secondary">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="btn-ghost !px-3"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ============ LOADING / ERROR ============ */}
      {isLoading && (
        <div className="grid place-items-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {isError && (
        <div className="card p-8 text-center text-text-secondary">
          Couldn't load the airing schedule. Try again in a moment.
        </div>
      )}

      {/* ============ CONTENT ============ */}
      {!isLoading && !isError && (
        <>
          {view === "today" && (
            <TodayView
              items={todayItems}
              filter={filter}
              libraryIds={libraryIds}
            />
          )}

          {view === "week" && (
            <WeekView
              days={days}
              grouped={grouped}
              todayKey={todayKey}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              filter={filter}
              libraryIds={libraryIds}
            />
          )}

          {view === "month" && (
            <MonthView
              startOfWeek={startOfWeek}
              days={days}
              grouped={grouped}
              todayKey={todayKey}
              filter={filter}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ============================================================
   TODAY VIEW — large hero cards for the current day
   ============================================================ */

function TodayView({ items, filter, libraryIds }) {
  if (items.length === 0) {
    return (
      <div className="card p-12 text-center">
        <CalendarIcon className="mx-auto h-10 w-10 text-text-muted" />
        <p className="mt-3 text-lg font-semibold">Nothing airing today</p>
        <p className="mt-1 text-sm text-text-secondary">
          {filter === "library"
            ? "None of the anime you follow airs today."
            : "No episodes scheduled for today."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">
          Today · {items.length} episode{items.length !== 1 ? "s" : ""}
        </h2>
        <p className="text-xs text-text-muted">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <TodayCard
            key={item.id}
            item={item}
            followed={libraryIds?.has(item.anime.mal_id)}
          />
        ))}
      </div>
    </div>
  );
}

function TodayCard({ item, followed }) {
  const a = item.anime;
  const time = new Date(item.airingAt * 1000);
  const title = a.title_english || a.title || a.title_romaji;
  const poster =
    a.images?.webp?.large_image_url ||
    a.images?.jpg?.large_image_url ||
    a.images?.jpg?.image_url;

  // Determine "airing in X" hint
  const diffMs = time.getTime() - Date.now();
  const diffHrs = diffMs / 1000 / 60 / 60;
  const airingHint =
    diffMs < 0
      ? "Aired"
      : diffHrs < 1
        ? `${Math.round(diffMs / 60000)}m`
        : `${Math.round(diffHrs)}h`;

  return (
    <Link
      to={`/anime/${a.mal_id}`}
      className="group card overflow-hidden transition hover:border-brand/60 hover:shadow-glow"
    >
      {/* Poster + overlays */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={poster}
          alt={title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Time badge */}
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
          <Clock className="h-3 w-3" />
          {time.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        {/* Followed badge */}
        {followed && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-brand px-2 py-1 text-[10px] font-bold text-white">
            <Star className="h-3 w-3 fill-white" /> FOLLOWED
          </div>
        )}

        {/* Episode */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand">
            Episode {item.episode}
          </p>
          <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white">
            {title}
          </h3>
        </div>
      </div>

      {/* Info row */}
      <div className="flex items-center justify-between p-3">
        <span className="text-[11px] font-medium text-text-muted">
          {a.format || "TV"}
          {a.year ? ` · ${a.year}` : ""}
        </span>
        <span className="text-[11px] font-bold text-text-secondary">
          {airingHint}
        </span>
      </div>
    </Link>
  );
}

/* ============================================================
   WEEK VIEW — compact list for all 7 days
   ============================================================ */

function WeekView({
  days,
  grouped,
  todayKey,
  selectedDay,
  onSelectDay,
  filter,
  libraryIds,
}) {
  return (
    <div className="space-y-6">
      {days.map((d) => {
        const k = dayKey(d);
        const items = grouped[k] || [];
        const isToday = k === todayKey;
        const isSelected = selectedDay === k;

        return (
          <div
            key={k}
            className={cn(
              "card overflow-hidden",
              isToday && "ring-1 ring-brand/40",
            )}
          >
            {/* Day header */}
            <div
              className={cn(
                "flex items-center justify-between border-b border-border-dark px-4 py-3",
                isToday && "bg-brand/5",
              )}
            >
              <div className="flex items-baseline gap-3">
                <h3
                  className={cn(
                    "text-base font-black",
                    isToday && "text-brand",
                  )}
                >
                  {d.toLocaleDateString(undefined, { weekday: "long" })}
                </h3>
                <span className="text-xs text-text-muted">
                  {d.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                {isToday && (
                  <span className="badge-red !text-[9px] !py-0.5">TODAY</span>
                )}
              </div>
              <span className="text-xs text-text-secondary">
                {items.length} episode{items.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Items */}
            {items.length === 0 ? (
              <p className="p-6 text-center text-xs text-text-muted">
                No episodes scheduled
              </p>
            ) : (
              <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <WeekItem
                    key={item.id}
                    item={item}
                    followed={libraryIds?.has(item.anime.mal_id)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WeekItem({ item, followed }) {
  const a = item.anime;
  const time = new Date(item.airingAt * 1000);
  const title = a.title_english || a.title || a.title_romaji;
  const poster = a.images?.jpg?.large_image_url || a.images?.jpg?.image_url;

  return (
    <Link
      to={`/anime/${a.mal_id}`}
      className="group flex items-center gap-3 rounded-lg border border-transparent p-2 transition hover:border-border-dark hover:bg-surface-elevated"
    >
      <img
        src={poster}
        alt=""
        className="h-14 w-10 shrink-0 rounded object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-xs font-semibold leading-tight">
          {title}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-text-muted">
          <Clock className="h-2.5 w-2.5" />
          {time.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {followed && (
            <Star className="ml-1 h-2.5 w-2.5 fill-brand text-brand" />
          )}
        </p>
        <p className="text-[10px] font-semibold text-brand">
          Episode {item.episode}
        </p>
      </div>
    </Link>
  );
}

/* ============================================================
   MONTH VIEW — grid of all 4-5 weeks in the month
   ============================================================ */

function MonthView({ startOfWeek, days, grouped, todayKey, filter }) {
  // Build a full month grid from the first of the month
  const monthGrid = useMemo(() => {
    const now = new Date(startOfWeek);
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Start from Monday of the week containing the 1st
    const startDay = firstOfMonth.getDay();
    const diffToMon = (startDay + 6) % 7;
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - diffToMon);

    const weeks = [];
    let cursor = new Date(gridStart);
    while (cursor <= lastOfMonth) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [startOfWeek]);

  return (
    <div className="space-y-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1.5">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-bold uppercase tracking-wider text-text-muted"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {monthGrid.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1.5">
          {week.map((d) => {
            const k = dayKey(d);
            const items = grouped[k] || [];
            const isToday = k === todayKey;
            const isCurrentMonth = d.getMonth() === startOfWeek.getMonth();

            return (
              <Link
                key={k}
                to={`#`}
                onClick={(e) => e.preventDefault()}
                className={cn(
                  "flex min-h-[100px] flex-col gap-1 rounded-lg border p-2 transition",
                  isToday
                    ? "border-brand bg-brand/5"
                    : isCurrentMonth
                      ? "border-border-dark bg-surface-card hover:border-brand/40"
                      : "border-border-dark/40 bg-surface-darker opacity-40",
                )}
              >
                <div className="flex items-baseline justify-between">
                  <span
                    className={cn(
                      "text-sm font-black",
                      isToday ? "text-brand" : "text-text-primary",
                    )}
                  >
                    {d.getDate()}
                  </span>
                  {items.length > 0 && (
                    <span className="rounded-full bg-surface-elevated px-1.5 text-[9px] font-semibold text-text-secondary">
                      {items.length}
                    </span>
                  )}
                </div>

                {/* Mini poster stack — max 2 */}
                <div className="flex flex-1 gap-0.5 overflow-hidden">
                  {items.slice(0, 2).map((item) => (
                    <img
                      key={item.id}
                      src={item.anime.images?.jpg?.image_url}
                      alt=""
                      className="h-full min-h-[40px] w-1/2 rounded object-cover"
                    />
                  ))}
                </div>

                {items.length > 2 && (
                  <span className="text-[9px] text-text-muted">
                    +{items.length - 2} more
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}

      <p className="pt-4 text-center text-xs text-text-muted">
        Click on a day in <strong>Week view</strong> to see full details
      </p>
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
