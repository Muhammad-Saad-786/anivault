// src/pages/Calendar.jsx
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import { mapAniListToJikan } from "@/lib/api/anilist";
import { cn } from "@/lib/utils";
import Spinner from "@/components/ui/Spinner";

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
        coverImage { large medium }
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

export default function Calendar() {
  const [weekOffset, setWeekOffset] = useState(0);

  const { startOfWeek, days } = useMemo(() => {
    const now = new Date();
    // Start of this week (Monday)
    const day = now.getDay(); // 0=Sun
    const diffToMon = (day + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMon + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
    return { startOfWeek: monday, days };
  }, [weekOffset]);

  const endOfWeek = useMemo(() => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + 7);
    return d;
  }, [startOfWeek]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["calendar", startOfWeek.toISOString(), endOfWeek.toISOString()],
    queryFn: async () => {
      // Fetch in 2 pages to cover full week (~200 entries usually enough)
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

  const grouped = useMemo(() => {
    const map = Object.fromEntries(days.map((d) => [dayKey(d), []]));
    for (const item of data || []) {
      const k = dayKey(new Date(item.airingAt * 1000));
      if (map[k]) map[k].push(item);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.airingAt - b.airingAt);
    }
    return map;
  }, [data, days]);

  const todayKey = dayKey(new Date());

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <CalendarIcon className="h-6 w-6 text-brand" /> Airing Calendar
          </h1>
          <p className="text-sm text-text-secondary">
            {startOfWeek.toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
            })}
            {" — "}
            {new Date(endOfWeek.getTime() - 1).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="btn-ghost"
          >
            <ChevronLeft className="h-4 w-4" /> Previous week
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="btn-ghost">
              This week
            </button>
          )}
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="btn-ghost"
          >
            Next week <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

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

      {!isLoading && !isError && (
        <div className="grid gap-4 lg:grid-cols-7">
          {days.map((d) => {
            const k = dayKey(d);
            const isToday = k === todayKey;
            const items = grouped[k] || [];

            return (
              <div
                key={k}
                className={cn(
                  "card overflow-hidden",
                  isToday && "ring-1 ring-brand/60",
                )}
              >
                <div
                  className={cn(
                    "border-b border-border-dark px-3 py-2",
                    isToday && "bg-brand/10",
                  )}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    {d.toLocaleDateString(undefined, { weekday: "short" })}
                  </p>
                  <p
                    className={cn(
                      "text-lg font-black",
                      isToday && "text-brand",
                    )}
                  >
                    {d.getDate()}
                  </p>
                </div>

                <div className="max-h-[600px] overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="p-3 text-center text-xs text-text-muted">
                      No episodes
                    </p>
                  ) : (
                    <ul className="divide-y divide-border-dark">
                      {items.map((item) => (
                        <CalendarItem key={item.id} item={item} />
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CalendarItem({ item }) {
  const a = item.anime;
  const time = new Date(item.airingAt * 1000);
  const title = a.title_english || a.title || a.title_romaji;

  return (
    <li>
      <Link
        to={`/anime/${a.mal_id}`}
        className="flex items-start gap-2 p-2.5 transition hover:bg-surface-elevated"
      >
        <img
          src={a.images?.jpg?.large_image_url || a.images?.jpg?.image_url}
          alt=""
          className="h-12 w-8 shrink-0 rounded object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-semibold leading-tight">
            {title}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-text-muted">
            <Clock className="h-2.5 w-2.5" />
            {time.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-[10px] text-brand">Episode {item.episode}</p>
        </div>
      </Link>
    </li>
  );
}

function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
