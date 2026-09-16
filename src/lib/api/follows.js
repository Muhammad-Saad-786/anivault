// src/lib/api/follows.js
import { supabase } from "@/lib/supabase";

/** Follow = add to watching (or mark as tracked for notifications). */
export async function isFollowingAnime(userId, animeId) {
  const { data } = await supabase
    .from("user_library")
    .select("id, status")
    .eq("user_id", userId)
    .eq("anime_id", animeId)
    .maybeSingle();
  return !!data;
}

export async function followAnime(userId, anime) {
  const { ensureAnimeCached, upsertLibraryEntry } =
    await import("@/lib/api/library");
  await ensureAnimeCached(anime);
  return upsertLibraryEntry(userId, anime.mal_id, {
    status: "plan_to_watch",
  });
}

export async function unfollowAnime(userId, animeId) {
  const { error } = await supabase
    .from("user_library")
    .delete()
    .eq("user_id", userId)
    .eq("anime_id", animeId);
  if (error) throw error;
}
