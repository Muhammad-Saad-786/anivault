// src/components/reviews/ReviewCard.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ThumbsUp,
  MessageCircle,
  AlertTriangle,
  Send,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  isReviewLiked,
  toggleReviewLike,
  getReviewComments,
  addReviewComment,
  deleteReviewComment,
} from "@/lib/api/reviews";
import { cn, formatCount } from "@/lib/utils";

export default function ReviewCard({ review }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [showSpoilers, setShowSpoilers] = useState(!review.has_spoilers);
  const [commentText, setCommentText] = useState("");

  const liked = useQuery({
    queryKey: ["review-like", user?.id, review.id],
    queryFn: () => isReviewLiked(user.id, review.id),
    enabled: !!user,
  });

  const likeMutation = useMutation({
    mutationFn: () => toggleReviewLike(user.id, review.id, !liked.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["review-like", user.id, review.id] });
      qc.invalidateQueries({ queryKey: ["reviews", review.anime_id] });
    },
  });

  const comments = useQuery({
    queryKey: ["review-comments", review.id],
    queryFn: () => getReviewComments(review.id),
    enabled: showComments,
  });

  const addComment = useMutation({
    mutationFn: (text) => addReviewComment(user.id, review.id, text),
    onSuccess: () => {
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["review-comments", review.id] });
    },
  });

  const removeComment = useMutation({
    mutationFn: (commentId) => deleteReviewComment(user.id, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["review-comments", review.id] });
    },
  });

  const author = review.author || {};
  const initial = (author.username ||
    author.display_name ||
    "U")[0].toUpperCase();

  return (
    <article className="card overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border-dark p-4">
        <Link to={`/u/${author.username}`} className="shrink-0">
          {author.avatar_url ? (
            <img
              src={author.avatar_url}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-sm font-black text-white">
              {initial}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            to={`/u/${author.username}`}
            className="line-clamp-1 text-sm font-semibold hover:text-brand"
          >
            {author.display_name || author.username || "Anonymous"}
          </Link>
          <p className="text-[11px] text-text-muted">
            {new Date(review.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {review.rating > 0 && (
          <div className="shrink-0 rounded-md bg-green-500/90 px-2 py-1 text-xs font-bold text-white">
            ★ {review.rating}
          </div>
        )}
      </header>

      {/* Body */}
      <div className="p-4">
        {review.has_spoilers && !showSpoilers ? (
          <button
            onClick={() => setShowSpoilers(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/20"
          >
            <AlertTriangle className="h-4 w-4" />
            This review contains spoilers — click to reveal
          </button>
        ) : (
          <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
            {review.body}
          </p>
        )}
      </div>

      {/* Actions */}
      <footer className="flex items-center gap-4 border-t border-border-dark px-4 py-2.5 text-xs">
        <button
          onClick={() => user && likeMutation.mutate()}
          disabled={!user || likeMutation.isPending}
          className={cn(
            "flex items-center gap-1.5 font-semibold transition",
            liked.data ? "text-brand" : "text-text-secondary hover:text-brand",
            !user && "cursor-not-allowed opacity-60",
          )}
        >
          <ThumbsUp className={cn("h-3.5 w-3.5", liked.data && "fill-brand")} />
          {formatCount(review.likes || 0)}
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 font-semibold text-text-secondary transition hover:text-brand"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {showComments ? "Hide" : "Comments"}
          {review.comment_count > 0 && ` · ${review.comment_count}`}
        </button>
      </footer>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-border-dark bg-surface-dark p-4">
          {comments.isLoading && (
            <p className="text-center text-xs text-text-muted">Loading…</p>
          )}

          {comments.data?.map((c) => (
            <div key={c.id} className="mb-3 flex items-start gap-2">
              {c.author?.avatar_url ? (
                <img
                  src={c.author.avatar_url}
                  alt=""
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-elevated text-[10px] font-bold text-text-secondary">
                  {(c.author?.username || "U")[0].toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <Link
                    to={`/u/${c.author?.username}`}
                    className="text-xs font-semibold hover:text-brand"
                  >
                    {c.author?.display_name || c.author?.username}
                  </Link>
                  <span className="text-[10px] text-text-muted">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                  {c.body}
                </p>
              </div>
              {user?.id === c.author?.id && (
                <button
                  onClick={() => removeComment.mutate(c.id)}
                  className="shrink-0 rounded p-1 text-text-muted hover:text-brand"
                  title="Delete comment"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {user && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const text = commentText.trim();
                if (!text) return;
                addComment.mutate(text);
              }}
              className="mt-3 flex gap-2"
            >
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment…"
                maxLength={1000}
                className="input-dark !text-xs"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || addComment.isPending}
                className="btn-brand !px-3 !py-2 !text-xs disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
