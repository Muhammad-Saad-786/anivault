// src/lib/api/follows.js
import { supabase } from "@/lib/supabase";

export async function isFollowing(followerId, followingId) {
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return !!data;
}

export async function followUser(followerId, followingId) {
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });
  if (error && error.code !== "23505") throw error;
}

export async function unfollowUser(followerId, followingId) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw error;
}

export async function getFollowers(userId) {
  const { data: rows, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", userId);

  if (error) throw error;
  if (!rows?.length) return [];

  const ids = rows.map((r) => r.follower_id);
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", ids);

  if (pErr) throw pErr;
  return profiles || [];
}

export async function getFollowing(userId) {
  const { data: rows, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (error) throw error;
  if (!rows?.length) return [];

  const ids = rows.map((r) => r.following_id);
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", ids);

  if (pErr) throw pErr;
  return profiles || [];
}

export async function getFollowingIds(userId) {
  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  if (error) throw error;
  return new Set((data || []).map((r) => r.following_id));
}

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
