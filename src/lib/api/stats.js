// src/lib/api/stats.js
import { supabase } from "@/lib/supabase";

/**
 * Full stats for a user. Used by Dashboard, Stats page, and Wrapped.
 */
export async function getUserStats(userId) {
  const { data, error } = await supabase
    .from("user_library")
    .select(
      `
      id,
      status,
      progress,
      rating,
      is_favorite,
      started_at,
      finished_at,
      created_at,
      updated_at,
      anime:anime_cache (
        id, title_en, title_romaji, poster_url, episodes, duration,
        genres, studios, year, season, type, score
      )
    `,
    )
    .eq("user_id", userId);

  if (error) throw error;
  const entries = data || [];

  const stats = {
    total: entries.length,
    completed: 0,
    watching: 0,
    planToWatch: 0,
    onHold: 0,
    dropped: 0,
    rewatching: 0,
    favorites: 0,
    episodesWatched: 0,
    watchMinutes: 0,
    ratingsSum: 0,
    ratingsCount: 0,
    avgRating: null,
    favoriteGenre: null,
    favoriteStudio: null,
    topRated: [],
    genreBreakdown: [],
    studioBreakdown: [],
    yearBreakdown: [],
    monthlyCompletions: [],
    thisYearCompleted: 0,
  };

  const genres = {};
  const studios = {};
  const years = {};
  const months = new Array(12).fill(0);
  const currentYear = new Date().getFullYear();

  for (const e of entries) {
    const a = e.anime || {};
    const perEp = a.duration || 24;
    const watched = e.progress || 0;

    // Status counts
    if (e.status === "completed") stats.completed += 1;
    if (e.status === "watching") stats.watching += 1;
    if (e.status === "plan_to_watch") stats.planToWatch += 1;
    if (e.status === "on_hold") stats.onHold += 1;
    if (e.status === "dropped") stats.dropped += 1;
    if (e.status === "rewatching") stats.rewatching += 1;
    if (e.is_favorite) stats.favorites += 1;

    // Watch time
    stats.episodesWatched += watched;
    stats.watchMinutes += watched * perEp;

    // Ratings
    if (e.rating) {
      stats.ratingsSum += Number(e.rating);
      stats.ratingsCount += 1;
    }

    // Genre / studio counts
    for (const g of a.genres || []) genres[g] = (genres[g] || 0) + 1;
    for (const s of a.studios || []) studios[s] = (studios[s] || 0) + 1;
    if (a.year) years[a.year] = (years[a.year] || 0) + 1;

    // Monthly completions (this year)
    if (e.status === "completed" && e.finished_at) {
      const d = new Date(e.finished_at);
      if (d.getFullYear() === currentYear) {
        months[d.getMonth()] += 1;
        stats.thisYearCompleted += 1;
      }
    }
  }

  stats.watchDays = +(stats.watchMinutes / 60 / 24).toFixed(1);
  stats.watchHours = Math.round(stats.watchMinutes / 60);
  stats.avgRating = stats.ratingsCount
    ? +(stats.ratingsSum / stats.ratingsCount).toFixed(1)
    : null;

  // Top lists
  const topOf = (obj, limit = 8) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));

  stats.genreBreakdown = topOf(genres, 10);
  stats.studioBreakdown = topOf(studios, 8);
  stats.yearBreakdown = Object.entries(years)
    .map(([year, count]) => ({ year: Number(year), count }))
    .sort((a, b) => a.year - b.year);
  stats.favoriteGenre = stats.genreBreakdown[0]?.name || null;
  stats.favoriteStudio = stats.studioBreakdown[0]?.name || null;

  // Top rated (user's own ratings)
  stats.topRated = entries
    .filter((e) => e.rating)
    .sort((a, b) => Number(b.rating) - Number(a.rating))
    .slice(0, 10)
    .map((e) => ({
      ...e.anime,
      userRating: Number(e.rating),
    }));

  stats.monthlyCompletions = months.map((count, i) => ({
    month: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ][i],
    count,
  }));

  return stats;
}

/**
 * Continue watching — sorted by most recently updated, watching only.
 */
export async function getContinueWatching(userId, limit = 12) {
  const { data, error } = await supabase
    .from("user_library")
    .select(
      `
      id, status, progress, updated_at,
      anime:anime_cache (id, title_en, title_romaji, poster_url, episodes, duration, type, year)
    `,
    )
    .eq("user_id", userId)
    .eq("status", "watching")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((e) => ({
    ...e.anime,
    progress: e.progress,
    totalEpisodes: e.anime?.episodes || 0,
    nextEpisode: (e.progress || 0) + 1,
    updatedAt: e.updated_at,
  }));
}

/**
 * Recently added — all statuses, newest first.
 */
export async function getRecentlyAdded(userId, limit = 12) {
  const { data, error } = await supabase
    .from("user_library")
    .select(
      `
      id, status, progress, created_at,
      anime:anime_cache (id, title_en, title_romaji, poster_url, episodes, type, year, score)
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((e) => ({ ...e.anime, addedAt: e.created_at }));
}

/**
 * Favorites.
 */
export async function getFavorites(userId, limit = 12) {
  const { data, error } = await supabase
    .from("user_library")
    .select(
      `
      id,
      anime:anime_cache (id, title_en, title_romaji, poster_url, episodes, type, year, score)
    `,
    )
    .eq("user_id", userId)
    .eq("is_favorite", true)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((e) => e.anime);
}

/**
 * Upcoming episodes for the user's watching list.
 * Uses anime_cache.broadcast which contains next_episode + airing_at (unix).
 * If a show doesn't have that info, it's filtered out.
 */
export async function getUpcomingEpisodes(userId, daysAhead = 14) {
  const { data, error } = await supabase
    .from("user_library")
    .select(
      `
      id, progress,
      anime:anime_cache (id, title_en, title_romaji, poster_url, episodes, broadcast, status)
    `,
    )
    .eq("user_id", userId)
    .in("status", ["watching", "rewatching"]);

  if (error) throw error;

  const now = Date.now() / 1000;
  const cutoff = now + daysAhead * 86400;

  return (data || [])
    .map((e) => {
      const b = e.anime?.broadcast;
      if (!b?.airing_at) return null;
      if (b.airing_at < now || b.airing_at > cutoff) return null;
      return {
        ...e.anime,
        nextEpisode: b.next_episode || (e.progress || 0) + 1,
        airingAt: b.airing_at,
        airsIn: b.airing_at - now,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.airingAt - b.airingAt);
}
