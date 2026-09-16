// src/lib/api/streaming.js

const API_BASE = import.meta.env.DEV
  ? "http://localhost:5173/api/consumet" // Vite dev proxies to /api
  : "/api/consumet";

async function call(provider, ...path) {
  const url = `${API_BASE}/anime/${provider}/${path
    .map((p) => encodeURIComponent(p))
    .join("/")}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/* ---------------- Public API ---------------- */

export const searchStream = (query, provider = "gogoanime") =>
  call(provider, query);

export const getStreamInfo = (id, provider = "gogoanime") =>
  call(provider, "info", id);

export const getEpisodeSources = (episodeId, provider = "gogoanime") =>
  call(provider, "watch", episodeId);

export const getEpisodeServers = (episodeId, provider = "gogoanime") =>
  call(provider, "servers", episodeId);

/* ---------------- Matching ---------------- */

/**
 * Find the best streaming ID for an AniList anime.
 * Tries multiple title variants, scores each result, returns best.
 */
export async function findStreamSource(anime, provider = "gogoanime") {
  const titles = [
    anime.title_english,
    anime.title_romaji,
    anime.title,
    anime.title_japanese,
  ].filter(Boolean);

  for (const title of titles) {
    try {
      const data = await searchStream(title, provider);
      const results = data?.results || [];
      if (!results.length) continue;

      const best = pickBestMatch(results, anime);
      if (best) return best;
    } catch {
      continue;
    }
  }
  return null;
}

function pickBestMatch(results, anime) {
  const targetYear = anime.year;
  const targetEpisodes = anime.episodes;

  const scored = results.map((r) => {
    let score = 0;
    const rTitle = String(r.title || "").toLowerCase();
    const aTitle = String(
      anime.title_english || anime.title_romaji || anime.title || "",
    ).toLowerCase();

    if (rTitle === aTitle) score += 60;
    else if (rTitle.includes(aTitle) || aTitle.includes(rTitle)) score += 30;

    if (targetYear && r.releaseDate?.includes(String(targetYear))) score += 25;

    if (targetEpisodes && r.totalEpisodes === targetEpisodes) score += 20;

    // Prefer SUB over DUB
    if (!rTitle.includes("dub")) score += 5;

    return { ...r, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);
  return scored[0]?._score >= 25 ? scored[0] : null;
}
