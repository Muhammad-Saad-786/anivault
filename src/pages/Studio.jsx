// src/pages/Studio.jsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, Building2 } from "lucide-react";
import { getStudioById } from "@/lib/api/anilist";
import AnimeCard from "@/components/anime/AnimeCard";
import Spinner from "@/components/ui/Spinner";
import { formatCount } from "@/lib/utils";
import SEO from "@/components/SEO";

export default function Studio() {
  const { id } = useParams();

  const {
    data: s,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["studio", id],
    queryFn: () => getStudioById(id),
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError || !s) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg font-semibold">Studio not found.</p>
        <Link to="/" className="btn-brand mt-4">
          Back home
        </Link>
      </div>
    );
  }

  const media = s.media?.nodes || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SEO
        title={s.name}
        description={`Explore anime productions from ${s.name} on AniVault.`}
        url={`${window.location.origin}/studio/${id}`}
      />
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black sm:text-4xl">{s.name}</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
              {s.isAnimationStudio ? "Animation Studio" : "Studio"}
              {s.favourites != null && (
                <span className="flex items-center gap-1">
                  · <Heart className="h-3 w-3 fill-brand text-brand" />
                  {formatCount(s.favourites)}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {media.length > 0 ? (
        <>
          <h2 className="mb-4 text-lg font-bold sm:text-xl">
            Productions · {media.length}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {media.map((a) => (
              <AnimeCard key={a.id} anime={mapNode(a)} />
            ))}
          </div>
        </>
      ) : (
        <p className="py-12 text-center text-sm text-text-secondary">
          No productions on record.
        </p>
      )}
    </div>
  );
}

function mapNode(a) {
  return {
    mal_id: a.idMal ?? a.id,
    title: a.title.romaji || a.title.english,
    title_english: a.title.english,
    title_romaji: a.title.romaji,
    images: {
      jpg: {
        large_image_url: a.coverImage?.large,
        image_url: a.coverImage?.medium,
      },
    },
    type: a.format,
    year: a.seasonYear,
    score: a.averageScore != null ? a.averageScore / 10 : null,
    episodes: a.episodes,
  };
}
