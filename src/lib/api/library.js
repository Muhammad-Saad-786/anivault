import { supabase } from "@/lib/supabase";

/**
 * Upsert a lean anime row into anime_cache so foreign keys work.
 * Called before any user_library insert.
 */
export async function ensureAnimeCached(anime) {
  if (!anime?.mal_id) return;

  const row = {
    id: anime.mal_id,
    anilist_id: anime.anilist_id || null,
    title_en: anime.title_english || anime.title || null,
    title_jp: anime.title_japanese || null,
    title_romaji: anime.title_romaji || anime.title || null,
    synonyms: anime.title_synonyms || [],
    synopsis: anime.synopsis || null,
    poster_url:
      anime.images?.webp?.large_image_url ||
      anime.images?.jpg?.large_image_url ||
      anime.images?.jpg?.image_url ||
      null,
    banner_url: anime.banner_url || null,
    trailer_url: anime.trailer?.url || null,
    genres: (anime.genres || []).map((g) => g.name),
    themes: (anime.themes || []).map((g) => g.name),
    demographics: (anime.demographics || []).map((g) => g.name),
    studios: (anime.studios || []).map((g) => g.name),
    producers: (anime.producers || []).map((g) => g.name),
    type: anime.type || null,
    source: anime.source || null,
    status: anime.status || null,
    rating: anime.rating || null,
    season: anime.season || null,
    year: anime.year || null,
    episodes: anime.episodes || null,
    duration: parseDuration(anime.duration),
    score: anime.score || null,
    popularity: anime.popularity || null,
    members: anime.members || null,
    aired_from: anime.aired?.from?.slice(0, 10) || null,
    aired_to: anime.aired?.to?.slice(0, 10) || null,
    broadcast: anime.broadcast || null,
    relations: anime.relations || null,
    raw: anime,
    cached_at: new Date().toISOString(),
  };

  await supabase.from("anime_cache").upsert(row, { onConflict: "id" });
}

function parseDuration(str) {
  if (!str) return null;
  const m = /(\d+)\s*min/.exec(str);
  return m ? Number(m[1]) : null;
}

export async function getLibraryEntry(userId, animeId) {
  const { data } = await supabase
    .from("user_library")
    .select("*")
    .eq("user_id", userId)
    .eq("anime_id", animeId)
    .maybeSingle();
  return data;
}

export async function upsertLibraryEntry(userId, animeId, patch = {}) {
  const { data, error } = await supabase
    .from("user_library")
    .upsert(
      { user_id: userId, anime_id: animeId, ...patch },
      { onConflict: "user_id,anime_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setStatus(userId, anime, status) {
  await ensureAnimeCached(anime);
  const entry = await getLibraryEntry(userId, anime.mal_id);

  const patch = { status };
  if (entry?.status !== status) {
    if (status === "watching" && !entry?.started_at) {
      patch.started_at = new Date().toISOString().slice(0, 10);
    }
    if (status === "completed") {
      patch.finished_at = new Date().toISOString().slice(0, 10);
      if (!entry?.progress && anime.episodes) patch.progress = anime.episodes;
    }
  }

  return upsertLibraryEntry(userId, anime.mal_id, patch);
}

export async function toggleFavorite(userId, anime, next) {
  await ensureAnimeCached(anime);
  return upsertLibraryEntry(userId, anime.mal_id, { is_favorite: next });
}

export async function updateProgress(userId, animeId, progress) {
  const patch = { progress };
  const entry = await getLibraryEntry(userId, animeId);

  // Auto-complete when progress hits total episodes
  if (entry && entry.status === "watching") {
    const total = await getAnimeTotalEpisodes(animeId);
    if (total && progress >= total) {
      patch.status = "completed";
      patch.finished_at = new Date().toISOString().slice(0, 10);
    }
  }

  return upsertLibraryEntry(userId, animeId, patch);
}

export async function updateRating(userId, animeId, rating) {
  return upsertLibraryEntry(userId, animeId, { rating });
}

export async function updateNotes(userId, animeId, notes) {
  return upsertLibraryEntry(userId, animeId, { notes });
}

export async function removeFromLibrary(userId, animeId) {
  const { error } = await supabase
    .from("user_library")
    .delete()
    .eq("user_id", userId)
    .eq("anime_id", animeId);
  if (error) throw error;
}

export async function getLibrary(userId) {
  const { data, error } = await supabase
    .from("user_library")
    .select(
      `
      *,
      anime:anime_cache (*)
    `,
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getLibraryStats(userId) {
  const { data, error } = await supabase
    .from("user_library")
    .select(
      "status, progress, rating, is_favorite, anime:anime_cache(episodes, duration, genres, studios)",
    )
    .eq("user_id", userId);
  if (error) throw error;

  const entries = data || [];
  let episodes = 0;
  let watchMinutes = 0;
  const genres = {};
  const studios = {};
  let ratingsSum = 0;
  let ratingsCount = 0;
  let completed = 0;

  for (const e of entries) {
    const totalEps = e.anime?.episodes || 0;
    const perEp = e.anime?.duration || 24;
    const watched = e.progress || 0;

    episodes += watched;
    watchMinutes += watched * perEp;

    if (e.status === "completed") completed += 1;
    if (e.rating) {
      ratingsSum += Number(e.rating);
      ratingsCount += 1;
    }
    for (const g of e.anime?.genres || []) genres[g] = (genres[g] || 0) + 1;
    for (const s of e.anime?.studios || []) studios[s] = (studios[s] || 0) + 1;
  }

  const topOf = (obj) =>
    Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    total: entries.length,
    completed,
    watching: entries.filter((e) => e.status === "watching").length,
    favorites: entries.filter((e) => e.is_favorite).length,
    episodes,
    watchMinutes,
    watchDays: +(watchMinutes / 60 / 24).toFixed(1),
    avgRating: ratingsCount ? +(ratingsSum / ratingsCount).toFixed(1) : null,
    favoriteGenre: topOf(genres),
    favoriteStudio: topOf(studios),
  };
}

/** Fetch total episodes from cache (fallback for auto-complete) */
async function getAnimeTotalEpisodes(animeId) {
  const { data } = await supabase
    .from("anime_cache")
    .select("episodes")
    .eq("id", animeId)
    .maybeSingle();
  return data?.episodes ?? null;
}
