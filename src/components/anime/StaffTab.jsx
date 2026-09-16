// src/components/anime/StaffTab.jsx
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStaffAniList } from "@/lib/api/anilist";
import Spinner from "@/components/ui/Spinner";

export default function StaffTab({ animeId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["anime", animeId, "staff"],
    queryFn: () => getStaffAniList(animeId),
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
        No staff data available.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((entry, idx) => {
        const p = entry.person;
        return (
          <Link
            key={`${p.mal_id}-${idx}`}
            to={`/person/${p.mal_id}`}
            className="card flex items-center gap-3 p-2.5 transition hover:bg-surface-elevated"
          >
            <img
              src={p.images?.jpg?.image_url}
              alt={p.name}
              className="h-16 w-16 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-semibold">{p.name}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-text-muted">
                {entry.positions?.join(", ")}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
