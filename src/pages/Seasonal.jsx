// src/pages/Seasonal.jsx
import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Check, Plus, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  SEASONS,
  fetchSeasonal,
  getCurrentSeason,
  bulkAddToPlanToWatch,
} from "@/lib/api/seasonal";
import AnimeGrid from "@/components/anime/AnimeGrid";
import AnimeCardSkeleton from "@/components/anime/AnimeCardSkeleton";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";

const TABS = [
  { value: "all", label: "All" },
  { value: "popular", label: "Most Popular" },
  { value: "airing", label: "Airing Now" },
  { value: "new", label: "New This Season" },
  { value: "sequels", label: "Sequels" },
  { value: "movies", label: "Movies" },
];

export default function Seasonal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();

  const currentYear = new Date().getFullYear();
  const currentSeason = getCurrentSeason();

  const season = params.get("season") || currentSeason;
  const year = Number(params.get("year") || currentYear);
  const tab = params.get("tab") || "all";

  const [adding, setAdding] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["seasonal", season, year],
    queryFn: () => fetchSeasonal({ season, year, page: 1, perPage: 50 }),
    staleTime: 30 * 60 * 1000,
  });

  const allItems = data || [];

  /* Filter by tab */
  const filtered = useMemo(() => {
    const items = [...allItems];
    switch (tab) {
      case "airing":
        return items.filter((a) => a.status === "RELEASING" || a.airing);
      case "new":
        return items.filter(
          (a) => !a.relations?.some((r) => r.relation === "PREQUEL"),
        );
      case "sequels":
        return items.filter((a) =>
          a.relations?.some((r) => r.relation === "PREQUEL"),
        );
      case "movies":
        return items.filter((a) => a.type === "MOVIE");
      case "popular":
      default:
        return items;
    }
  }, [allItems, tab]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const shiftSeason = (dir) => {
    const idx = SEASONS.findIndex((s) => s.value === season);
    let nextIdx = idx + dir;
    let nextYear = year;
    if (nextIdx < 0) {
      nextIdx = SEASONS.length - 1;
      nextYear -= 1;
    } else if (nextIdx >= SEASONS.length) {
      nextIdx = 0;
      nextYear += 1;
    }
    const next = new URLSearchParams(params);
    next.set("season", SEASONS[nextIdx].value);
    next.set("year", String(nextYear));
    setParams(next);
  };

  const addAll = async () => {
    if (!user) {
      // Redirect to login
      window.location.href = "/login";
      return;
    }
    if (!filtered.length) return;
    if (
      !confirm(`Add all ${filtered.length} anime to your Plan to Watch list?`)
    )
      return;

    setAdding(true);
    try {
      const count = await bulkAddToPlanToWatch(user.id, filtered);
      setAddedCount(count);
      qc.invalidateQueries({ queryKey: ["library"] });
      setTimeout(() => setAddedCount(0), 4000);
    } catch (e) {
      alert("Failed to add: " + e.message);
    } finally {
      setAdding(false);
    }
  };

  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear + 2; y >= currentYear - 8; y -= 1) years.push(y);
    return years;
  }, [currentYear]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SEO
        title={`${season[0].toUpperCase()}${season.slice(1)} ${year} Anime`}
        description="Explore the latest seasonal anime releases on AniVault."
      />
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <Calendar className="h-6 w-6 text-brand" />
            Seasonal Anime
          </h1>
          <p className="text-sm text-text-secondary">
            Explore every anime season
          </p>
        </div>

        {filtered.length > 0 && (
          <button
            onClick={addAll}
            disabled={adding}
            className="btn-brand w-fit"
          >
            {addedCount > 0 ? (
              <>
                <Check className="h-4 w-4" />
                Added {addedCount}
              </>
            ) : adding ? (
              <>
                <Spinner className="h-4 w-4" /> Adding…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add all to Plan to Watch
              </>
            )}
          </button>
        )}
      </div>

      {/* Season selector */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => shiftSeason(-1)}
          className="btn-ghost !px-3"
          aria-label="Previous season"
        >
          ←
        </button>

        <div className="flex gap-1.5">
          {SEASONS.map((s) => (
            <button
              key={s.value}
              onClick={() => update("season", s.value)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition",
                season === s.value
                  ? "border-brand bg-brand text-white"
                  : "border-border-dark bg-surface-card text-text-secondary hover:border-brand/60 hover:text-text-primary",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <select
          value={year}
          onChange={(e) => update("year", e.target.value)}
          className="input-dark !w-28"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <button
          onClick={() => shiftSeason(1)}
          className="btn-ghost !px-3"
          aria-label="Next season"
        >
          →
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border-dark pb-px">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => update("tab", t.value)}
            className={cn(
              "shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition",
              tab === t.value
                ? "border-brand text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <div className="card p-8 text-center text-text-secondary">
          Couldn't load this season. Try again in a moment.
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-lg font-semibold">No anime in this category</p>
          <p className="mt-1 text-sm text-text-secondary">
            Try a different tab or season.
          </p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <AnimeGrid items={filtered} />
      )}
    </div>
  );
}
