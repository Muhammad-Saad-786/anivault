import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Star, Trash2 } from "lucide-react";
import {
  updateRating,
  updateNotes,
  removeFromLibrary,
} from "@/lib/api/library";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function EditEntryDialog({ entry, onClose }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(entry.rating || 0);
  const [notes, setNotes] = useState(entry.notes || "");

  const anime = entry.anime;

  const saveMutation = useMutation({
    mutationFn: async () => {
      await updateRating(user.id, anime.id, rating || null);
      await updateNotes(user.id, anime.id, notes || null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library"] });
      onClose();
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeFromLibrary(user.id, anime.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library"] });
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-card border border-border-dark bg-surface-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Edit entry</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-surface-elevated"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 line-clamp-2 text-sm text-text-secondary">
          {anime.title_en || anime.title_romaji}
        </p>

        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted">
          Your rating
        </label>
        <div className="mb-5 flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className="grid h-8 w-8 place-items-center rounded-md border border-border-dark text-xs font-semibold transition hover:border-brand/60"
            >
              {n <= rating ? (
                <Star className="h-3.5 w-3.5 fill-brand text-brand" />
              ) : (
                <span className="text-text-muted">{n}</span>
              )}
            </button>
          ))}
        </div>

        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Your thoughts (private)…"
          className="input-dark mb-5 resize-none"
        />

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => removeMutation.mutate()}
            disabled={removeMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-brand/40 px-3 py-2 text-xs font-semibold text-brand transition hover:bg-brand/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className={cn(
                "btn-brand",
                saveMutation.isPending && "opacity-50",
              )}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
