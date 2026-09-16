// src/lib/api/streaming.js
// Streaming via Miruro embed providers.
// No scraping, no backend, no Cloudflare — pure iframe embeds.

/**
 * Available embed providers.
 * Both are verified working from Pakistan and everywhere else.
 */
export const EMBED_PROVIDERS = [
  {
    id: "megavid",
    name: "Megavid",
    // Uses AniList ID (not MAL)
    makeUrl(anilistId, episode, lang = "sub") {
      return `https://megavid.buzz/ani/${anilistId}/${episode}/${lang}?autoplay=true`;
    },
  },
  {
    id: "anixo",
    name: "AniXo",
    makeUrl(anilistId, episode, lang = "sub") {
      return `https://anixo.buzz/embed/ani/${anilistId}/${episode}/${lang}?autoplay=true`;
    },
  },
];

/** Default provider */
export const DEFAULT_PROVIDER = "megavid";

/**
 * Get a single embed URL.
 */
export function getEmbedUrl(
  anilistId,
  episode,
  lang = "sub",
  providerId = DEFAULT_PROVIDER,
) {
  const provider =
    EMBED_PROVIDERS.find((p) => p.id === providerId) || EMBED_PROVIDERS[0];
  return {
    provider: provider.id,
    providerName: provider.name,
    url: provider.makeUrl(anilistId, episode, lang),
  };
}

/**
 * Get all embed URLs (for provider switching).
 */
export function getAllEmbedUrls(anilistId, episode, lang = "sub") {
  return EMBED_PROVIDERS.map((p) => ({
    id: p.id,
    name: p.name,
    url: p.makeUrl(anilistId, episode, lang),
  }));
}

/** Check if an anime is streamable (has an AniList or MAL ID). */
export function isStreamable(anime) {
  return !!(anime?.anilist_id || anime?.mal_id);
}
