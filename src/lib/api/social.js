// src/lib/api/social.js
import { supabase } from "@/lib/supabase";

/**
 * Activity feed: recent reviews + completions + list creations
 * from the users you follow. Merge-sorted.
 */
export async function getActivityFeed(userId, { limit = 30 } = {}) {
  // 1. Get IDs of users we follow
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const ids = (follows || []).map((f) => f.following_id);
  if (ids.length === 0) return [];

  const [reviews, completions, lists] = await Promise.all([
    supabase
      .from("reviews")
      .select(
        `id, rating, body, created_at,
         author:profiles!reviews_user_id_fkey(id, username, display_name, avatar_url),
         anime:anime_cache(id, title_en, title_romaji, poster_url)`,
      )
      .in("user_id", ids)
      .order("created_at", { ascending: false })
      .limit(limit),

    supabase
      .from("user_library")
      .select(
        `id, status, finished_at,
         user:profiles!user_library_user_id_fkey(id, username, display_name, avatar_url),
         anime:anime_cache(id, title_en, title_romaji, poster_url)`,
      )
      .in("user_id", ids)
      .eq("status", "completed")
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false })
      .limit(limit),

    supabase
      .from("custom_lists")
      .select(
        `id, name, created_at, is_public,
         owner:profiles!custom_lists_user_id_fkey(id, username, display_name, avatar_url)`,
      )
      .in("user_id", ids)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const items = [];

  for (const r of reviews.data || []) {
    if (!r.anime) continue;
    items.push({
      type: "review",
      at: r.created_at,
      id: `review-${r.id}`,
      author: r.author,
      anime: r.anime,
      rating: r.rating,
      text: r.body?.slice(0, 200),
    });
  }

  for (const c of completions.data || []) {
    if (!c.anime) continue;
    items.push({
      type: "completed",
      at: c.finished_at,
      id: `completed-${c.id}`,
      author: c.user,
      anime: c.anime,
    });
  }

  for (const l of lists.data || []) {
    items.push({
      type: "list",
      at: l.created_at,
      id: `list-${l.id}`,
      author: l.owner,
      listName: l.name,
      listId: l.id,
    });
  }

  items.sort((a, b) => new Date(b.at) - new Date(a.at));
  return items.slice(0, limit);
}

/**
 * Compatibility: how similar are two users' anime tastes?
 * Score 0-100, weighted by shared favorites + shared ratings proximity.
 */
export async function computeCompatibility(userAId, userBId) {
  if (!userAId || !userBId) return null;
  if (userAId === userBId) return 100;

  const [a, b] = await Promise.all([
    supabase
      .from("user_library")
      .select("anime_id, rating, is_favorite")
      .eq("user_id", userAId),
    supabase
      .from("user_library")
      .select("anime_id, rating, is_favorite")
      .eq("user_id", userBId),
  ]);

  const listA = a.data || [];
  const listB = b.data || [];

  if (!listA.length || !listB.length) return 0;

  const mapA = new Map(listA.map((e) => [e.anime_id, e]));
  const mapB = new Map(listB.map((e) => [e.anime_id, e]));

  const shared = [...mapA.keys()].filter((k) => mapB.has(k));
  if (shared.length === 0) return 0;

  let score = 0;
  let weight = 0;

  for (const id of shared) {
    const ea = mapA.get(id);
    const eb = mapB.get(id);

    // Rating proximity (0-10 → similarity 0-1)
    if (ea.rating != null && eb.rating != null) {
      const diff = Math.abs(Number(ea.rating) - Number(eb.rating));
      const similarity = 1 - Math.min(diff / 10, 1);
      score += similarity * 3;
      weight += 3;
    }

    // Both favorited = strong positive
    if (ea.is_favorite && eb.is_favorite) {
      score += 4;
      weight += 4;
    } else if (ea.is_favorite || eb.is_favorite) {
      score += 0.5;
      weight += 4;
    }
  }

  const raw = weight ? score / weight : 0;
  return Math.round(raw * 100);
}
