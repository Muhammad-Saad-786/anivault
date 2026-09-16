// src/components/anime/CharactersTab.jsx
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCharactersAniList } from "@/lib/api/anilist";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

export default function CharactersTab({ animeId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["anime", animeId, "characters"],
    queryFn: () => getCharactersAniList(animeId),
    staleTime: 30 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <p className="py-12 text-center text-sm text-text-secondary">
        No character data available.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((entry, idx) => {
        const c = entry.character;
        const va = entry.voice_actors?.[0]?.person;
        const img = c.images?.jpg?.image_url;

        return (
          <div key={`${c.mal_id}-${idx}`} className="card flex overflow-hidden">
            {/* Character */}
            <Link
              to={`/character/${c.mal_id}`}
              className="flex flex-1 items-center gap-3 p-2.5 transition hover:bg-surface-elevated"
            >
              <img
                src={img}
                alt={c.name}
                className="h-16 w-16 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold">{c.name}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wider text-text-muted">
                  {entry.role}
                </p>
              </div>
            </Link>

            {/* Voice actor */}
            {va && (
              <Link
                to={`/person/${va.mal_id}`}
                className={cn(
                  "flex flex-1 flex-row-reverse items-center gap-3 border-l border-border-dark p-2.5 text-right transition hover:bg-surface-elevated",
                )}
              >
                <img
                  src={va.images?.jpg?.image_url}
                  alt={va.name}
                  className="h-16 w-16 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold">
                    {va.name}
                  </p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-text-muted">
                    VA (JP)
                  </p>
                </div>
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
