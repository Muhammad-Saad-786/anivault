import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ChevronDown,
  Bookmark,
  Play,
  Pause,
  Check,
  X,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getLibraryEntry, setStatus, toggleFavorite } from "@/lib/api/library";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import FavoriteButton from "@/components/library/FavoriteButton";

const STATUSES = [
  {
    value: "watching",
    label: "Watching",
    icon: Play,
    color: "text-status-watching",
  },
  {
    value: "completed",
    label: "Completed",
    icon: Check,
    color: "text-status-completed",
  },
  {
    value: "plan_to_watch",
    label: "Plan to Watch",
    icon: Bookmark,
    color: "text-status-plan",
  },
  {
    value: "on_hold",
    label: "On Hold",
    icon: Pause,
    color: "text-status-onhold",
  },
  { value: "dropped", label: "Dropped", icon: X, color: "text-status-dropped" },
  {
    value: "rewatching",
    label: "Rewatching",
    icon: RotateCcw,
    color: "text-status-rewatching",
  },
];

export default function AddToLibrary({ anime, size = "md" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: entry } = useQuery({
    queryKey: ["library", "entry", user?.id, anime?.mal_id],
    queryFn: () => getLibraryEntry(user.id, anime.mal_id),
    enabled: !!user && !!anime?.mal_id,
  });

  const statusMutation = useMutation({
    mutationFn: (status) => setStatus(user.id, anime, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library"] });
      qc.invalidateQueries({
        queryKey: ["library", "entry", user.id, anime.mal_id],
      });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
    },
    onError: (err) => {
      // eslint-disable-next-line no-console
      console.error("[status] failed:", err.message);
      alert("Could not update status: " + err.message);
    },
  });

  const favMutation = useMutation({
    mutationFn: (next) => toggleFavorite(user.id, anime, next),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library"] });
      qc.invalidateQueries({
        queryKey: ["library", "entry", user.id, anime.mal_id],
      });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => {
      // eslint-disable-next-line no-console
      console.error("[favorite] failed:", err.message);
      alert("Could not update favorite: " + err.message);
    },
  });

  if (!user) {
    return (
      <button
        onClick={() => navigate("/login")}
        className={cn("btn-brand", size === "sm" && "!px-4 !py-2 !text-xs")}
      >
        <Plus className="h-4 w-4" /> Add to List
      </button>
    );
  }

  const current = STATUSES.find((s) => s.value === entry?.status);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "btn-brand",
            size === "sm" && "!px-4 !py-2 !text-xs",
            !current &&
              "bg-surface-elevated hover:bg-surface-card text-text-primary",
          )}
        >
          {current ? (
            <>
              <current.icon className="h-4 w-4" />
              {current.label}
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add to List
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </>
          )}
        </button>

        <FavoriteButton anime={anime} />
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-card border border-border-dark bg-surface-card shadow-card">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => statusMutation.mutate(s.value)}
                disabled={statusMutation.isPending}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2.5 text-sm text-left transition hover:bg-surface-elevated",
                  entry?.status === s.value && "bg-surface-elevated",
                )}
              >
                <s.icon className={cn("h-4 w-4", s.color)} />
                {s.label}
              </button>
            ))}

            {entry && (
              <>
                <div className="h-px bg-border-dark" />
                <button
                  onClick={async () => {
                    const { removeFromLibrary } =
                      await import("@/lib/api/library");
                    await removeFromLibrary(user.id, anime.mal_id);
                    qc.invalidateQueries({ queryKey: ["library"] });
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-brand hover:bg-surface-elevated"
                >
                  <X className="h-4 w-4" /> Remove
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
