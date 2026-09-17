// src/components/lists/AddToListMenu.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ListPlus, Check, Plus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserLists,
  getListsContaining,
  addToList,
  removeFromList,
  createList,
} from "@/lib/api/lists";
import { cn } from "@/lib/utils";

export default function AddToListMenu({ anime }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const animeId = anime?.anilist_id || anime?.mal_id;

  const lists = useQuery({
    queryKey: ["lists", user?.id],
    queryFn: () => getUserLists(user.id),
    enabled: !!user && open,
  });

  const inLists = useQuery({
    queryKey: ["lists-containing", user?.id, animeId],
    queryFn: () => getListsContaining(user.id, animeId),
    enabled: !!user && !!animeId,
  });

  const toggle = useMutation({
    mutationFn: async ({ listId, isIn }) => {
      if (isIn) {
        await removeFromList(listId, animeId);
      } else {
        // Ensure the anime is cached before adding to a list (FK requirement)
        const { ensureAnimeCached } = await import("@/lib/api/library");
        await ensureAnimeCached(anime);
        await addToList(listId, animeId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["lists-containing", user.id, animeId],
      });
      qc.invalidateQueries({ queryKey: ["lists", user.id] });
      qc.invalidateQueries({ queryKey: ["list"] });
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const list = await createList(user.id, { name: newName, isPublic: true });
      const { ensureAnimeCached } = await import("@/lib/api/library");
      await ensureAnimeCached(anime);
      await addToList(list.id, animeId);
      return list;
    },
    onSuccess: () => {
      setCreating(false);
      setNewName("");
      qc.invalidateQueries({ queryKey: ["lists", user.id] });
      qc.invalidateQueries({
        queryKey: ["lists-containing", user.id, animeId],
      });
    },
  });

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost !px-4 !py-2.5"
      >
        <ListPlus className="h-4 w-4" />
        Add to List
      </button>

      {open && (
        <>
          {/* Click-away */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute left-0 z-50 mt-2 w-72 overflow-hidden rounded-card border border-border-dark bg-surface-card shadow-card">
            <div className="flex items-center justify-between border-b border-border-dark px-3 py-2">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Your Lists
              </p>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-text-muted hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* List of user's lists */}
            <div className="max-h-72 overflow-y-auto">
              {lists.isLoading && (
                <p className="p-4 text-center text-xs text-text-muted">
                  Loading…
                </p>
              )}

              {!lists.isLoading &&
                (lists.data || []).length === 0 &&
                !creating && (
                  <p className="p-4 text-center text-xs text-text-muted">
                    You haven't created any lists yet.
                  </p>
                )}

              {(lists.data || []).map((l) => {
                const isIn = inLists.data?.has(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => toggle.mutate({ listId: l.id, isIn })}
                    disabled={toggle.isPending}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-surface-elevated",
                      isIn && "bg-brand/5",
                    )}
                  >
                    <span className="line-clamp-1 flex-1">{l.name}</span>
                    {isIn ? (
                      <Check className="h-4 w-4 shrink-0 text-brand" />
                    ) : (
                      <Plus className="h-4 w-4 shrink-0 text-text-muted" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Create new list */}
            <div className="border-t border-border-dark p-2">
              {creating ? (
                <div className="flex gap-1.5">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New list name"
                    maxLength={80}
                    className="input-dark !py-1.5 !text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newName.trim()) {
                        create.mutate();
                      }
                    }}
                  />
                  <button
                    onClick={() => create.mutate()}
                    disabled={!newName.trim() || create.isPending}
                    className="btn-brand !px-3 !py-1.5 !text-xs disabled:opacity-50"
                  >
                    {create.isPending ? "…" : "Add"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-brand hover:bg-surface-elevated"
                >
                  <Plus className="h-3.5 w-3.5" /> New list
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
