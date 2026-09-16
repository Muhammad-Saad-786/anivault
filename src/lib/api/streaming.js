// src/lib/api/streaming.js

const API_BASE = "/api/consumet";

const DEFAULT_PROVIDER = "hianime";

async function call(params) {
  const url = new URL(API_BASE, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null) url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/* ---------------- Public API ---------------- */

export const searchStream = (q, provider = DEFAULT_PROVIDER) =>
  call({ provider, action: "search", q });

export const getStreamInfo = (id, provider = DEFAULT_PROVIDER) =>
  call({ provider, action: "info", id });

export const getEpisodeSources = (episodeId, provider = DEFAULT_PROVIDER) =>
  call({ provider, action: "watch", episodeId });

export const getEpisodeServers = (episodeId, provider = DEFAULT_PROVIDER) =>
  call({ provider, action: "servers", episodeId });

/* ---------------- Matching ---------------- */

export async function findStreamSource(anime) {
  const providers = ["hianime", "animekai", "animepahe"];
  const titles = [
    anime.title_english,
    anime.title_romaji,
    anime.title,
    anime.title_japanese,
  ].filter(Boolean);

  for (const provider of providers) {
    for (const title of titles) {
      try {
        const data = await searchStream(title, provider);
        const results = data?.results || [];
        if (!results.length) continue;

        const best = pickBestMatch(results, anime);
        if (best) return { ...best, _provider: provider };
      } catch {
        continue;
      }
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
    if (!rTitle.includes("dub")) score += 5;

    return { ...r, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);
  return scored[0]?._score >= 25 ? scored[0] : null;
}
