// src/components/reviews/ReviewsTab.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getAnimeReviews, getUserReview } from "@/lib/api/reviews";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import Spinner from "@/components/ui/Spinner";

export default function ReviewsTab({ animeId }) {
  const { user } = useAuth();
  const [writing, setWriting] = useState(false);

  const reviews = useQuery({
    queryKey: ["reviews", animeId],
    queryFn: () => getAnimeReviews(animeId),
  });

  const userReview = useQuery({
    queryKey: ["user-review", user?.id, animeId],
    queryFn: () => getUserReview(user.id, animeId),
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      {/* Write button / form */}
      {user && !writing && (
        <div className="flex justify-end">
          <button onClick={() => setWriting(true)} className="btn-brand">
            {userReview.data ? "Edit your review" : "Write a review"}
          </button>
        </div>
      )}

      {writing && (
        <ReviewForm
          animeId={animeId}
          existingReview={userReview.data}
          onDone={() => setWriting(false)}
        />
      )}

      {/* Review list */}
      {reviews.isLoading && (
        <div className="grid place-items-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!reviews.isLoading && (reviews.data || []).length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-lg font-semibold">No reviews yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Be the first to share your thoughts.
          </p>
        </div>
      )}

      {!reviews.isLoading &&
        (reviews.data || []).map((r) => <ReviewCard key={r.id} review={r} />)}
    </div>
  );
}
