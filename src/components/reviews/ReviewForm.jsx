// src/components/reviews/ReviewForm.jsx
import { useState, useEffect } from "react";
import { Star, AlertTriangle, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { upsertReview, deleteReview } from "@/lib/api/reviews";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function ReviewForm({ animeId, existingReview, onDone }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [body, setBody] = useState(existingReview?.body || "");
  const [hasSpoilers, setHasSpoilers] = useState(
    existingReview?.has_spoilers || false,
  );

  useEffect(() => {
    setRating(existingReview?.rating || 0);
    setBody(existingReview?.body || "");
    setHasSpoilers(existingReview?.has_spoilers || false);
  }, [existingReview?.id]);

  const save = useMutation({
    mutationFn: () =>
      upsertReview(user.id, animeId, { rating, body, hasSpoilers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", animeId] });
      qc.invalidateQueries({ queryKey: ["user-review", user.id, animeId] });
      onDone?.();
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteReview(user.id, animeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", animeId] });
      qc.invalidateQueries({ queryKey: ["user-review", user.id, animeId] });
      onDone?.();
    },
  });

  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
        {existingReview ? "Edit your review" : "Write a review"}
      </h3>

      {/* Star rating */}
      <div className="mt-4">
        <label className="mb-2 block text-xs font-semibold text-text-secondary">
          Your rating
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-md border text-xs font-bold transition",
                n <= rating
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border-dark bg-surface-dark text-text-muted hover:border-brand/40",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="mt-4">
        <label className="mb-2 block text-xs font-semibold text-text-secondary">
          Review
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          maxLength={5000}
          placeholder="Share your thoughts on this anime..."
          className="input-dark resize-none"
        />
      </div>

      {/* Spoiler toggle */}
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={hasSpoilers}
          onChange={(e) => setHasSpoilers(e.target.checked)}
          className="accent-brand"
        />
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-text-secondary">
          This review contains spoilers
        </span>
      </label>

      {/* Actions */}
      <div className="mt-5 flex justify-between gap-2">
        {existingReview ? (
          <button
            onClick={() => {
              if (confirm("Delete your review?")) remove.mutate();
            }}
            disabled={remove.isPending}
            className="flex items-center gap-1 rounded-lg border border-brand/40 px-3 py-2 text-xs font-semibold text-brand hover:bg-brand/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        ) : (
          <span />
        )}

        <div className="flex gap-2">
          {onDone && (
            <button onClick={onDone} className="btn-ghost !text-xs">
              Cancel
            </button>
          )}
          <button
            onClick={() => save.mutate()}
            disabled={!body.trim() || save.isPending}
            className="btn-brand !text-xs disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : existingReview ? "Update" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
