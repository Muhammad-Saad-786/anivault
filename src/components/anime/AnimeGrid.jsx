// src/components/anime/AnimeGrid.jsx
import AnimeCard from "./AnimeCard";
import { cn } from "@/lib/utils";

function getKey(a) {
  return a.anilist_id || a.mal_id || a.id;
}

export default function AnimeGrid({ items = [], className }) {
  if (!items.length) return null;
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
        className,
      )}
    >
      {items.map((a) => (
        <AnimeCard key={getKey(a)} anime={a} />
      ))}
    </div>
  );
}
