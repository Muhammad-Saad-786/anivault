// src/pages/Search.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  SlidersHorizontal,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { searchAnimeAniList } from "@/lib/api/anilist";
import { useDebounce } from "@/hooks/useDebounce";
import AnimeGrid from "@/components/anime/AnimeGrid";
import AnimeCardSkeleton from "@/components/anime/AnimeCardSkeleton";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";

const TYPES = ["tv", "movie", "ova", "ona", "special"];
const STATUSES = ["airing", "complete", "upcoming"];
const SORTS = [
  { value: "popularity", label: "Most Popular" },
  { value: "score", label: "Highest Rated" },
  { value: "trending", label: "Trending" },
  { value: "start_date", label: "Recently Released" },
  { value: "title", label: "A–Z" },
];

const PER_PAGE = 24;

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [showFilters, setShowFilters] = useState(false);
  const debouncedQ = useDebounce(q, 500);

  const resultsTopRef = useRef(null);

  // ---- Read filters + page from URL ----
  const filters = {
    type: params.get("type") || "",
    status: params.get("status") || "",
    order_by: params.get("order_by") || "popularity",
    min_score: params.get("min_score") || "",
    year: params.get("year") || "",
  };
  const page = Math.max(1, Number(params.get("page") || 1));

  // ---- Build query params ----
  const queryParams = useMemo(() => {
    const p = {
      q: debouncedQ.trim() || undefined,
      sort: filters.order_by,
      perPage: PER_PAGE,
      page,
    };
    if (filters.type) p.type = filters.type;
    if (filters.status) p.status = filters.status;
    if (filters.min_score) p.minScore = Number(filters.min_score);
    if (filters.year) p.year = Number(filters.year);
    return p;
  }, [debouncedQ, filters, page]);

  const trimmed = debouncedQ.trim();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["search", queryParams],
    queryFn: () => searchAnimeAniList(queryParams),
    keepPreviousData: true,
    enabled: trimmed.length === 0 || trimmed.length >= 3,
  });

  // ---- Reset to page 1 whenever search or filters change ----
  const filterSignature = JSON.stringify({
    q: debouncedQ.trim(),
    ...filters,
  });
  useEffect(() => {
    if (page !== 1) {
      const next = new URLSearchParams(params);
      next.delete("page");
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSignature]);

  // ---- Scroll to top of results when page changes ----
  useEffect(() => {
    if (resultsTopRef.current) {
      resultsTopRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    // Reset page when filters change (but not when setting page itself)
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const setPage = (n) => {
    const next = new URLSearchParams(params);
    if (n <= 1) next.delete("page");
    else next.set("page", String(n));
    setParams(next);
  };

  const clearAll = () => {
    setQ("");
    setParams(new URLSearchParams());
  };

  const activeFilters = Object.values(filters).filter(Boolean).length - 1; // -1 for default order_by

  const results = data?.data ?? [];
  const total = data?.pagination?.items?.total ?? 0;
  const lastPage = data?.pagination?.last_visible_page ?? 1;
  const hasNext = data?.pagination?.has_next_page ?? false;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SEO
        title="Browse Anime"
        description="Search and discover anime by title, genre, season, and more on AniVault."
      />
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Browse Anime</h1>
          <p className="text-sm text-text-secondary">
            {total > 0
              ? `${total.toLocaleString()} results`
              : "Search titles, genres, studios…"}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="btn-ghost"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilters > 0 && (
              <span className="ml-1 rounded-full bg-brand px-1.5 text-[10px] text-white">
                {activeFilters}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search input */}
      <div className="mb-5">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title (EN, JP, romaji), studio, or keyword…"
          className="input-dark !py-3 !text-base"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filters sidebar */}
        <aside
          className={cn(
            "space-y-4 lg:sticky lg:top-20 lg:block lg:h-fit",
            showFilters ? "block" : "hidden",
          )}
        >
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">Filters</h3>
              <button
                onClick={clearAll}
                className="text-xs text-text-secondary hover:text-brand"
              >
                Clear all
              </button>
            </div>

            <FilterGroup label="Type">
              <ChipRow
                options={TYPES}
                value={filters.type}
                onChange={(v) => update("type", v)}
              />
            </FilterGroup>

            <FilterGroup label="Status">
              <ChipRow
                options={STATUSES}
                value={filters.status}
                onChange={(v) => update("status", v)}
              />
            </FilterGroup>

            <FilterGroup label="Sort by">
              <select
                value={filters.order_by}
                onChange={(e) => update("order_by", e.target.value)}
                className="input-dark"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </FilterGroup>

            <FilterGroup label="Min score">
              <input
                type="number"
                min="1"
                max="10"
                step="0.5"
                placeholder="e.g. 7.5"
                value={filters.min_score}
                onChange={(e) => update("min_score", e.target.value)}
                className="input-dark"
              />
            </FilterGroup>

            <FilterGroup label="Year">
              <input
                type="number"
                min="1960"
                max={new Date().getFullYear() + 2}
                placeholder="e.g. 2024"
                value={filters.year}
                onChange={(e) => update("year", e.target.value)}
                className="input-dark"
              />
            </FilterGroup>
          </div>
        </aside>

        {/* Results */}
        <div ref={resultsTopRef}>
          {/* Loading state (initial) */}
          {isLoading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 15 }).map((_, i) => (
                <AnimeCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="card p-8 text-center">
              <p className="font-semibold text-text-primary">Search failed</p>
              <p className="mt-1 text-sm text-text-secondary">
                The anime database didn't respond. Please try again.
              </p>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="btn-brand mt-4"
              >
                <RefreshCw
                  className={cn("h-4 w-4", isFetching && "animate-spin")}
                />
                Retry
              </button>
            </div>
          )}

          {/* Too short */}
          {!isLoading &&
            !isError &&
            trimmed.length > 0 &&
            trimmed.length < 3 && (
              <div className="card p-12 text-center text-text-secondary">
                <p className="text-sm">
                  Keep typing — at least 3 characters to search.
                </p>
              </div>
            )}

          {/* No results */}
          {!isLoading &&
            !isError &&
            results.length === 0 &&
            (trimmed.length === 0 || trimmed.length >= 3) && (
              <div className="card p-12 text-center">
                <p className="text-lg font-semibold">No results found</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Try a different keyword or clear some filters.
                </p>
                <button onClick={clearAll} className="btn-brand mt-4">
                  Reset search
                </button>
              </div>
            )}

          {/* Results + pagination */}
          {!isLoading && !isError && results.length > 0 && (
            <>
              {/* Dim + fade grid while fetching next page */}
              <div
                className={cn(
                  "transition-opacity duration-200",
                  isFetching && "pointer-events-none opacity-50",
                )}
              >
                <AnimeGrid items={results} />
              </div>

              {/* Pagination */}
              {lastPage > 1 && (
                <Pagination
                  page={page}
                  lastPage={lastPage}
                  hasNext={hasNext}
                  onPage={setPage}
                  isFetching={isFetching}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Pagination component ---------- */

function Pagination({ page, lastPage, hasNext, onPage, isFetching }) {
  // Build the range of pages to show
  const pages = useMemo(() => {
    const total = Math.min(lastPage, 500); // AniList caps around 500 pages
    const range = [];
    const around = 2; // pages on each side of current

    let start = Math.max(1, page - around);
    let end = Math.min(total, page + around);

    // Ensure we always show up to 5 page buttons
    if (end - start < 4) {
      if (start === 1) end = Math.min(total, 5);
      else if (end === total) start = Math.max(1, total - 4);
    }

    for (let i = start; i <= end; i++) range.push(i);
    return { range, total, first: start, last: end };
  }, [page, lastPage]);

  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {/* Prev */}
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1 || isFetching}
          className="btn-ghost !px-3 disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* First page + ellipsis */}
        {pages.first > 1 && (
          <>
            <PageButton
              n={1}
              current={page}
              onPage={onPage}
              disabled={isFetching}
            />
            {pages.first > 2 && <span className="px-2 text-text-muted">…</span>}
          </>
        )}

        {/* Page numbers */}
        {pages.range.map((n) => (
          <PageButton
            key={n}
            n={n}
            current={page}
            onPage={onPage}
            disabled={isFetching}
          />
        ))}

        {/* Ellipsis + last page */}
        {pages.last < pages.total && (
          <>
            {pages.last < pages.total - 1 && (
              <span className="px-2 text-text-muted">…</span>
            )}
            <PageButton
              n={pages.total}
              current={page}
              onPage={onPage}
              disabled={isFetching}
            />
          </>
        )}

        {/* Next */}
        <button
          onClick={() => onPage(page + 1)}
          disabled={!hasNext || isFetching}
          className="btn-ghost !px-3 disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <p className="text-xs text-text-secondary">
        Page {page} of {Math.min(lastPage, 500)}
        {isFetching && <span className="ml-2 text-text-muted">Loading…</span>}
      </p>
    </div>
  );
}

function PageButton({ n, current, onPage, disabled }) {
  const active = n === current;
  return (
    <button
      onClick={() => onPage(n)}
      disabled={disabled || active}
      className={cn(
        "grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-sm font-medium transition",
        active
          ? "border-brand bg-brand text-white"
          : "border-border-dark bg-surface-card text-text-secondary hover:border-brand/60 hover:text-text-primary",
        disabled && "opacity-60",
      )}
    >
      {n}
    </button>
  );
}

/* ---------- Filter helpers ---------- */

function FilterGroup({ label, children }) {
  return (
    <div className="mb-4 border-t border-border-dark pt-3 first:border-t-0 first:pt-0">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </p>
      {children}
    </div>
  );
}

function ChipRow({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(value === opt ? "" : opt)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition",
            value === opt
              ? "border-brand bg-brand text-white"
              : "border-border-dark bg-surface-dark text-text-secondary hover:border-brand/60 hover:text-text-primary",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
