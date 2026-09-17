// src/pages/ListDetail.jsx
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Globe, Lock, Plus, Search, Trash2, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getList,
  addToList,
  removeFromList,
  updateList,
} from "@/lib/api/lists";
import { searchAnimeAniList } from "@/lib/api/anilist";
import { ensureAnimeCached } from "@/lib/api/library";
import AnimeCard from "@/components/anime/AnimeCard";
import Spinner from "@/components/ui/Spinner";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";

export default function ListDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);

  const {
    data: list,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["list", id],
    queryFn: () => getList(id),
  });

  const isOwner = user?.id === list?.user_id;

  // Search results
  const search = useQuery({
    queryKey: ["list-search", debouncedQuery],
    queryFn: () => searchAnimeAniList({ q: debouncedQuery, perPage: 12 }),
    enabled: adding && debouncedQuery.length >= 3,
  });

  // Items already in the list (for quick lookup)
  const inListIds = new Set((list?.items || []).map((i) => i.anime?.id));

  const add = useMutation({
    mutationFn: async (anime) => {
      await ensureAnimeCached(anime);
      await addToList(list.id, anime.mal_id, list.items?.length || 0);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["list", id] });
    },
  });

  const remove = useMutation({
    mutationFn: (animeId) => removeFromList(list.id, animeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["list", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError || !list) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg font-semibold">List not found</p>
        <Link to="/lists" className="btn-brand mt-4">
          Back to lists
        </Link>
      </div>
    );
  }

  if (!list.is_public && !isOwner) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Lock className="mx-auto h-10 w-10 text-text-muted" />
        <p className="mt-3 text-lg font-semibold">This list is private</p>
        <Link to="/lists" className="btn-brand mt-4">
          Back to lists
        </Link>
      </div>
    );
  }

  const items = (list.items || []).map((i) => i.anime).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SEO
        title={list.name}
        description={
          list.description ||
          `Anime list created by ${list.owner?.display_name || list.owner?.username || "an AniVault user"}.`
        }
        url={`${window.location.origin}/lists/${id}`}
      />
      {/* Back link */}
      <Link
        to={isOwner ? "/lists" : `/u/${list.owner?.username}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
            {list.is_public ? (
              <>
                <Globe className="h-3.5 w-3.5 text-green-400" />
                <span className="text-green-400">Public list</span>
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 text-text-muted" />
                <span className="text-text-muted">Private</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-black sm:text-3xl">{list.name}</h1>
          {list.description && (
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              {list.description}
            </p>
          )}
          <p className="mt-3 text-xs text-text-muted">
            by{" "}
            <Link
              to={`/u/${list.owner?.username}`}
              className="text-brand hover:underline"
            >
              {list.owner?.display_name || list.owner?.username}
            </Link>{" "}
            · {items.length} {items.length === 1 ? "anime" : "anime"}
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setAdding((v) => !v)}
            className={cn(adding ? "btn-ghost" : "btn-brand")}
          >
            {adding ? (
              <>
                <X className="h-4 w-4" /> Close
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Add anime
              </>
            )}
          </button>
        )}
      </div>

      {/* Add panel */}
      {adding && isOwner && (
        <div className="card mb-8 p-4">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anime to add…"
              className="input-dark pl-9"
            />
          </div>

          {debouncedQuery.length > 0 && debouncedQuery.length < 3 && (
            <p className="py-4 text-center text-xs text-text-muted">
              Keep typing — at least 3 characters.
            </p>
          )}

          {search.isLoading && (
            <p className="py-4 text-center text-xs text-text-muted">
              Searching…
            </p>
          )}

          {search.data?.data?.length > 0 && (
            <div className="grid max-h-96 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 md:grid-cols-6">
              {search.data.data.map((a) => {
                const alreadyIn = inListIds.has(a.mal_id);
                return (
                  <div key={a.mal_id} className="relative">
                    <AnimeCard anime={a} />
                    <button
                      onClick={() => {
                        if (alreadyIn) remove.mutate(a.mal_id);
                        else add.mutate(a);
                      }}
                      disabled={add.isPending || remove.isPending}
                      className={cn(
                        "absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full text-xs font-bold shadow-lg transition",
                        alreadyIn
                          ? "bg-green-500 text-white hover:bg-red-500"
                          : "bg-brand text-white hover:bg-brand-hover",
                      )}
                      title={alreadyIn ? "Remove from list" : "Add to list"}
                    >
                      {alreadyIn ? "✓" : "+"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {debouncedQuery.length >= 3 &&
            search.data?.data?.length === 0 &&
            !search.isLoading && (
              <p className="py-4 text-center text-xs text-text-muted">
                No anime found for "{debouncedQuery}".
              </p>
            )}
        </div>
      )}

      {/* List content */}
      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-lg font-semibold">This list is empty</p>
          <p className="mt-1 text-sm text-text-secondary">
            {isOwner
              ? 'Click "Add anime" above to start adding titles.'
              : "The owner hasn't added anything yet."}
          </p>
          {isOwner && !adding && (
            <button onClick={() => setAdding(true)} className="btn-brand mt-4">
              <Plus className="h-4 w-4" /> Add your first anime
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((a) => (
            <div key={a.id} className="group relative">
              <AnimeCard anime={a} />
              {isOwner && (
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Remove "${a.title_en || a.title_romaji}" from this list?`,
                      )
                    ) {
                      remove.mutate(a.id);
                    }
                  }}
                  disabled={remove.isPending}
                  className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur transition hover:bg-brand group-hover:opacity-100"
                  title="Remove from list"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
