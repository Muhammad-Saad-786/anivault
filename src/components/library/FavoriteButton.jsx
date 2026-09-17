// src/components/library/FavoriteButton.jsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getLibraryEntry, toggleFavorite } from "@/lib/api/library";
import { cn } from "@/lib/utils";

export default function FavoriteButton({ anime, size = "md" }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: entry } = useQuery({
    queryKey: ["library", "entry", user?.id, anime?.mal_id],
    queryFn: () => getLibraryEntry(user.id, anime.mal_id),
    enabled: !!user && !!anime?.mal_id,
  });

  const mutation = useMutation({
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
    },
  });

  const isFav = !!entry?.is_favorite;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user || mutation.isPending) return;
        mutation.mutate(!isFav);
      }}
      disabled={!user || mutation.isPending}
      className={cn(
        "grid place-items-center rounded-lg border transition",
        isFav
          ? "border-status-favorite/40 bg-status-favorite/10"
          : "border-border-dark bg-surface-card hover:bg-surface-elevated",
        size === "sm" ? "h-9 w-9" : "h-10 w-10",
        mutation.isPending && "opacity-60",
        !user && "cursor-not-allowed opacity-60",
      )}
      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
      title={
        !user
          ? "Sign in to favorite"
          : isFav
            ? "Remove from favorites"
            : "Add to favorites"
      }
    >
      <Heart
        className={cn(
          "h-4 w-4 transition",
          isFav
            ? "fill-status-favorite text-status-favorite"
            : "text-text-secondary",
        )}
      />
    </button>
  );
}
