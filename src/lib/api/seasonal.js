// src/lib/api/seasonal.js
import { getSeasonalAniList } from "@/lib/api/anilist";

export const SEASONS = [
  { value: "winter", label: "Winter", months: "Jan–Mar" },
  { value: "spring", label: "Spring", months: "Apr–Jun" },
  { value: "summer", label: "Summer", months: "Jul–Sep" },
  { value: "fall", label: "Fall", months: "Oct–Dec" },
];

export function getCurrentSeason(date = new Date()) {
  const m = date.getMonth();
  if (m <= 1) return "winter";
  if (m <= 4) return "spring";
  if (m <= 7) return "summer";
  return "fall";
}

export function getSeasonOptions(yearsBack = 8, yearsForward = 2) {
  const currentYear = new Date().getFullYear();
  const out = [];
  for (
    let y = currentYear + yearsForward;
    y >= currentYear - yearsBack;
    y -= 1
  ) {
    for (const s of SEASONS) {
      out.push({
        season: s.value,
        year: y,
        label: `${s.label} ${y}`,
      });
    }
  }
  return out;
}

export async function fetchSeasonal({ season, year, page = 1, perPage = 24 }) {
  return getSeasonalAniList(season, year, page, perPage);
}

/**
 * Bulk add anime list to a user's Plan to Watch.
 * Uses Supabase upsert with ON CONFLICT, so existing entries aren't clobbered.
 */
export async function bulkAddToPlanToWatch(userId, animeList) {
  const { ensureAnimeCached } = await import("@/lib/api/library");
  const { supabase } = await import("@/lib/supabase");

  // Cache all anime first (parallel, but batched)
  await Promise.all(animeList.map((a) => ensureAnimeCached(a)));

  const rows = animeList.map((a) => ({
    user_id: userId,
    anime_id: a.mal_id,
    status: "plan_to_watch",
  }));

  const { error } = await supabase.from("user_library").upsert(rows, {
    onConflict: "user_id,anime_id",
    ignoreDuplicates: true, // don't overwrite existing rows
  });
  if (error) throw error;
  return rows.length;
}
