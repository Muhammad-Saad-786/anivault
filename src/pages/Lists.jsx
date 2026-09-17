// src/pages/Lists.jsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  List as ListIcon,
  Plus,
  Lock,
  Globe,
  Trash2,
  Search,
  Compass,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserLists,
  createList,
  deleteList,
  getDiscoverLists,
} from "@/lib/api/lists";
import Spinner from "@/components/ui/Spinner";
import { useDebounce } from "@/hooks/useDebounce";
import { cn, formatCount } from "@/lib/utils";
import SEO from "@/components/SEO";

const TABS = [
  { value: "mine", label: "My Lists", icon: UserIcon },
  { value: "discover", label: "Discover", icon: Compass },
];

export default function Lists() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState("mine");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // --- My lists ---
  const myLists = useQuery({
    queryKey: ["lists", user?.id],
    queryFn: () => getUserLists(user.id),
    enabled: !!user && tab === "mine",
  });

  // --- Discover ---
  const discover = useQuery({
    queryKey: ["discover-lists", user?.id, debouncedSearch],
    queryFn: () =>
      getDiscoverLists({
        excludeUserId: user?.id,
        search: debouncedSearch.trim() || undefined,
        limit: 30,
      }),
    enabled: !!user && tab === "discover",
    staleTime: 60 * 1000,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <SEO
        title="Anime Lists"
        description="Create, manage, and discover anime lists on AniVault."
      />
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-black sm:text-3xl">
          <ListIcon className="h-6 w-6 text-brand" /> Lists
        </h1>
        <p className="text-sm text-text-secondary">
          Your collections and public lists from the community
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center justify-between gap-3 border-b border-border-dark pb-px">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition",
                tab === t.value
                  ? "border-brand text-text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary",
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "mine" && <CreateListButton />}
      </div>

      {/* Content */}
      {tab === "mine" && <MyListsTab lists={myLists} />}

      {tab === "discover" && (
        <DiscoverTab query={discover} search={search} setSearch={setSearch} />
      )}
    </div>
  );
}

/* ============================================================
   MY LISTS TAB
   ============================================================ */

function MyListsTab({ lists }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const remove = useMutation({
    mutationFn: (id) => deleteList(id, user.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lists", user.id] }),
  });

  if (lists.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const data = lists.data || [];

  if (data.length === 0) {
    return (
      <div className="card p-12 text-center">
        <ListIcon className="mx-auto h-10 w-10 text-text-muted" />
        <p className="mt-3 text-lg font-semibold">No lists yet</p>
        <p className="mt-1 text-sm text-text-secondary">
          Create your first custom collection above.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((l) => (
        <ListCard
          key={l.id}
          list={l}
          onDelete={() => {
            if (confirm(`Delete "${l.name}"?`)) remove.mutate(l.id);
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   DISCOVER TAB
   ============================================================ */

function DiscoverTab({ query, search, setSearch }) {
  if (query.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="card p-8 text-center text-text-secondary">
        Couldn't load public lists. Try again in a moment.
      </div>
    );
  }

  const lists = query.data || [];

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search public lists…"
            className="input-dark pl-9"
          />
        </div>
      </div>

      {lists.length === 0 ? (
        <div className="card p-12 text-center">
          <Compass className="mx-auto h-10 w-10 text-text-muted" />
          <p className="mt-3 text-lg font-semibold">
            {search ? "No matching lists" : "No public lists yet"}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {search
              ? "Try a different search."
              : "Be the first to share a public list."}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs text-text-muted">
            {formatCount(lists.length)} public{" "}
            {lists.length === 1 ? "list" : "lists"}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((l) => (
              <ListCard key={l.id} list={l} showOwner />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   REUSABLE LIST CARD
   ============================================================ */

function ListCard({ list, onDelete, showOwner = false }) {
  const initial = (list.owner?.username || "U")[0].toUpperCase();

  return (
    <div className="card group relative overflow-hidden transition hover:border-brand/40">
      <Link to={`/lists/${list.id}`} className="block">
        {/* Cover + info */}
        <div className="flex">
          {list.poster_url ? (
            <img
              src={list.poster_url}
              alt=""
              className="h-28 w-20 shrink-0 object-cover"
            />
          ) : (
            <div className="grid h-28 w-20 shrink-0 place-items-center bg-surface-elevated text-text-muted">
              <ListIcon className="h-6 w-6" />
            </div>
          )}

          <div className="min-w-0 flex-1 p-3">
            {/* Visibility pill */}
            <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider">
              {list.is_public ? (
                <>
                  <Globe className="h-3 w-3 text-green-400" />
                  <span className="text-green-400">Public</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 text-text-muted" />
                  <span className="text-text-muted">Private</span>
                </>
              )}
            </div>

            <h3 className="line-clamp-2 text-sm font-bold">{list.name}</h3>

            {list.description && (
              <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
                {list.description}
              </p>
            )}

            <p className="mt-2 text-[11px] font-semibold text-text-muted">
              {list.item_count || 0} {list.item_count === 1 ? "anime" : "anime"}
            </p>

            {/* Owner (discover only) */}
            {showOwner && list.owner && (
              <div className="mt-2 flex items-center gap-1.5">
                {list.owner.avatar_url ? (
                  <img
                    src={list.owner.avatar_url}
                    alt=""
                    className="h-4 w-4 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-brand text-[8px] font-black text-white">
                    {initial}
                  </span>
                )}
                <span className="text-[10px] text-text-muted">
                  by{" "}
                  <span className="font-semibold text-text-secondary">
                    {list.owner.display_name || list.owner.username}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Delete button (owner only) */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
          className="absolute right-2 top-2 rounded p-1.5 text-text-muted opacity-0 transition hover:bg-surface-elevated hover:text-brand group-hover:opacity-100"
          title="Delete list"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ============================================================
   CREATE LIST BUTTON + MODAL
   ============================================================ */

function CreateListButton() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    isPublic: true,
  });

  const create = useMutation({
    mutationFn: () => createList(user.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lists", user.id] });
      setOpen(false);
      setForm({ name: "", description: "", isPublic: true });
    },
  });

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-brand">
        <Plus className="h-4 w-4" /> New list
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-card border border-border-dark bg-surface-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold">Create a new list</h3>

            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="List name (e.g. Best Anime Ever)"
              maxLength={80}
              className="input-dark mb-3"
            />

            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Description (optional)"
              rows={3}
              maxLength={300}
              className="input-dark mb-3 resize-none"
            />

            <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) =>
                  setForm({ ...form, isPublic: e.target.checked })
                }
                className="accent-brand"
              />
              <Globe className="h-4 w-4 text-green-400" />
              <span className="text-text-secondary">Make this list public</span>
            </label>

            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="btn-ghost">
                Cancel
              </button>
              <button
                onClick={() => create.mutate()}
                disabled={!form.name.trim() || create.isPending}
                className="btn-brand disabled:opacity-50"
              >
                {create.isPending ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
