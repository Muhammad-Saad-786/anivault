// src/pages/Character.jsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, Star } from "lucide-react";
import { getCharacterById } from "@/lib/api/anilist";
import AnimeCard from "@/components/anime/AnimeCard";
import Spinner from "@/components/ui/Spinner";
import { formatCount } from "@/lib/utils";
import SEO from "@/components/SEO";

export default function Character() {
  const { id } = useParams();

  const {
    data: c,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["character", id],
    queryFn: () => getCharacterById(id),
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError || !c) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg font-semibold">Character not found.</p>
        <Link to="/" className="btn-brand mt-4">
          Back home
        </Link>
      </div>
    );
  }

  const image = c.image?.large || c.image?.medium;
  const appearances = (c.media?.edges || []).map((e) => ({
    role: e.characterRole,
    anime: e.node,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SEO
        title={c.name.full}
        description={
          c.description
            ? stripDescription(c.description).slice(0, 200)
            : `Learn more about ${c.name.full} on AniVault.`
        }
        image={image}
        url={`${window.location.origin}/character/${id}`}
      />
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row">
        {image && (
          <img
            src={image}
            alt={c.name.full}
            className="h-64 w-48 shrink-0 rounded-card border border-border-dark object-cover shadow-card sm:h-80 sm:w-56"
          />
        )}

        <div className="flex-1">
          <h1 className="text-2xl font-black sm:text-4xl">{c.name.full}</h1>
          {c.name.native && (
            <p className="mt-1 text-sm text-text-secondary">{c.name.native}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-text-secondary">
            {c.favourites != null && (
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 fill-brand text-brand" />
                {formatCount(c.favourites)} favorites
              </span>
            )}
            {c.gender && <span>{prettyGender(c.gender)}</span>}
            {c.age && <span>Age {c.age}</span>}
            {c.bloodType && <span>Blood {c.bloodType}</span>}
          </div>

          {c.description && (
            <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-text-secondary">
              {stripDescription(c.description)}
            </p>
          )}
        </div>
      </div>

      {/* Appearances */}
      {appearances.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-bold sm:text-xl">Appearances</h2>
          <div className="space-y-6">
            {["MAIN", "SUPPORTING", "BACKGROUND"].map((role) => {
              const list = appearances.filter((a) => a.role === role);
              if (!list.length) return null;
              return (
                <div key={role}>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-text-muted">
                    {role.charAt(0) + role.slice(1).toLowerCase()} ·{" "}
                    {list.length}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {list.map(({ anime }) => (
                      <AnimeCard key={anime.id} anime={mapNode(anime)} />
                    ))}
                  </div>
                </div>
              );
            })}
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

function prettyGender(g) {
  if (!g) return "";
  return g.charAt(0) + g.slice(1).toLowerCase();
}

function stripDescription(desc) {
  if (!desc) return "";
  // AniList sometimes includes "source: ..." trailing notes; keep them.
  return desc
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}
