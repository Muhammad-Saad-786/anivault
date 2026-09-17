// src/pages/Person.jsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, Mic, Film } from "lucide-react";
import { getPersonById } from "@/lib/api/anilist";
import AnimeCard from "@/components/anime/AnimeCard";
import Spinner from "@/components/ui/Spinner";
import { formatCount } from "@/lib/utils";
import SEO from "@/components/SEO";

export default function Person() {
  const { id } = useParams();

  const {
    data: p,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["person", id],
    queryFn: () => getPersonById(id),
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError || !p) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg font-semibold">Person not found.</p>
        <Link to="/" className="btn-brand mt-4">
          Back home
        </Link>
      </div>
    );
  }

  const image = p.image?.large || p.image?.medium;

  const voiceRoles = (p.characterMedia?.edges || []).map((e) => ({
    role: e.characterRole,
    character: e.characters?.[0],
    anime: e.node,
  }));

  const staffRoles = (p.staffMedia?.edges || []).map((e) => ({
    role: e.staffRole,
    anime: e.node,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SEO
        title={p.name.full}
        description={
          p.description
            ? p.description.slice(0, 200)
            : `Explore ${p.name.full}'s anime work on AniVault.`
        }
        image={image}
        url={`${window.location.origin}/person/${id}`}
      />
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row">
        {image && (
          <img
            src={image}
            alt={p.name.full}
            className="h-64 w-48 shrink-0 rounded-card border border-border-dark object-cover shadow-card sm:h-80 sm:w-56"
          />
        )}

        <div className="flex-1">
          <h1 className="text-2xl font-black sm:text-4xl">{p.name.full}</h1>
          {p.name.native && (
            <p className="mt-1 text-sm text-text-secondary">{p.name.native}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-text-secondary">
            {p.favourites != null && (
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 fill-brand text-brand" />
                {formatCount(p.favourites)} favorites
              </span>
            )}
            {p.languageV2 && <span>{p.languageV2}</span>}
            {p.gender && (
              <span>
                {p.gender.charAt(0) + p.gender.slice(1).toLowerCase()}
              </span>
            )}
            {p.age && <span>Age {p.age}</span>}
            {p.homeTown && <span>From {p.homeTown}</span>}
          </div>

          {p.description && (
            <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-text-secondary">
              {p.description
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<[^>]+>/g, "")
                .trim()}
            </p>
          )}
        </div>
      </div>

      {/* Voice roles */}
      {voiceRoles.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold sm:text-xl">
            <Mic className="h-5 w-5 text-brand" /> Voice Roles
          </h2>
          <div className="space-y-4">
            {voiceRoles.slice(0, 20).map(({ character, role, anime }, i) => (
              <Link
                key={i}
                to={`/anime/${anime.idMal ?? anime.id}`}
                className="card flex items-center gap-3 p-2.5 transition hover:bg-surface-elevated"
              >
                {character?.image?.large && (
                  <img
                    src={character.image.large}
                    alt={character.name.full}
                    className="h-14 w-14 shrink-0 rounded-md object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold">
                    {character?.name?.full || "Unknown character"}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {role} · {anime.title.romaji || anime.title.english}
                  </p>
                </div>
                {anime.coverImage?.large && (
                  <img
                    src={anime.coverImage.large}
                    alt=""
                    className="h-14 w-10 shrink-0 rounded object-cover"
                  />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Staff roles */}
      {staffRoles.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold sm:text-xl">
            <Film className="h-5 w-5 text-brand" /> Staff Work
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {staffRoles.slice(0, 24).map(({ anime, role }, i) => (
              <div key={i} className="space-y-1">
                <AnimeCard anime={mapNode(anime)} />
                <p className="line-clamp-2 text-[10px] text-text-muted">
                  {role}
                </p>
              </div>
            ))}
          </div>
        </div>
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
  };
}
