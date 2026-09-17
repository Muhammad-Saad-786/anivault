// src/lib/api/reviews.js
import { supabase } from "@/lib/supabase";

/* ---------------- Reads ---------------- */

/**
 * Reviews for an anime, newest first, with author profile + like count.
 */
export async function getAnimeReviews(
  animeId,
  { limit = 20, offset = 0 } = {},
) {
  // Step 1: Get reviews without joining profiles
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("anime_id", Number(animeId))
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  if (!reviews || reviews.length === 0) return [];

  // Step 2: Fetch author profiles separately
  const userIds = [...new Set(reviews.map((r) => r.user_id))];
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", userIds);

  if (pErr) throw pErr;

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return reviews.map((r) => ({
    ...r,
    author: profileMap.get(r.user_id) || null,
  }));
}

/**
 * The current user's review for an anime, if any.
 */
export async function getUserReview(userId, animeId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("anime_id", Number(animeId))
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Reviews by a specific user, for their profile page.
 */
export async function getUserReviews(userId, { limit = 20 } = {}) {
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!reviews?.length) return [];

  // Fetch anime separately
  const animeIds = [...new Set(reviews.map((r) => r.anime_id))];
  const { data: anime, error: aErr } = await supabase
    .from("anime_cache")
    .select("id, title_en, title_romaji, poster_url")
    .in("id", animeIds);

  if (aErr) throw aErr;

  const map = new Map((anime || []).map((a) => [a.id, a]));
  return reviews
    .map((r) => ({ ...r, anime: map.get(r.anime_id) || null }))
    .filter((r) => r.anime);
}

/**
 * Community feed — recent reviews from anyone, with the anime attached.
 */
export async function getRecentReviews({ limit = 20 } = {}) {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id, rating, body, has_spoilers, likes, created_at,
      author:profiles!reviews_user_id_fkey (id, username, display_name, avatar_url),
      anime:anime_cache (id, title_en, title_romaji, poster_url)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

/* ---------------- Writes ---------------- */

export async function upsertReview(
  userId,
  animeId,
  { rating, body, hasSpoilers },
) {
  const numericAnimeId = Number(animeId);
  if (!numericAnimeId || Number.isNaN(numericAnimeId)) {
    throw new Error("Invalid anime ID");
  }

  const existing = await getUserReview(userId, numericAnimeId);

  if (existing) {
    const { data, error } = await supabase
      .from("reviews")
      .update({ rating, body, has_spoilers: hasSpoilers })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: userId,
      anime_id: numericAnimeId,
      rating,
      body,
      has_spoilers: hasSpoilers,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteReview(userId, animeId) {
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("user_id", userId)
    .eq("anime_id", Number(animeId));
  if (error) throw error;
}

/* ---------------- Likes ---------------- */

export async function isReviewLiked(userId, reviewId) {
  const { data, error } = await supabase
    .from("review_likes")
    .select("review_id")
    .eq("user_id", userId)
    .eq("review_id", reviewId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function toggleReviewLike(userId, reviewId, liked) {
  if (liked) {
    const { error } = await supabase
      .from("review_likes")
      .insert({ user_id: userId, review_id: reviewId });
    if (error && error.code !== "23505") throw error; // ignore duplicate
  } else {
    const { error } = await supabase
      .from("review_likes")
      .delete()
      .eq("user_id", userId)
      .eq("review_id", reviewId);
    if (error) throw error;
  }

  // Refresh denormalized count
  const { count } = await supabase
    .from("review_likes")
    .select("*", { count: "exact", head: true })
    .eq("review_id", reviewId);

  await supabase
    .from("reviews")
    .update({ likes: count || 0 })
    .eq("id", reviewId);
}

/* ---------------- Comments ---------------- */

export async function getReviewComments(reviewId) {
  const { data: comments, error } = await supabase
    .from("review_comments")
    .select("*")
    .eq("review_id", reviewId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!comments?.length) return [];

  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", userIds);

  if (pErr) throw pErr;

  const map = new Map((profiles || []).map((p) => [p.id, p]));
  return comments.map((c) => ({ ...c, author: map.get(c.user_id) || null }));
}

export async function addReviewComment(userId, reviewId, body) {
  const { data, error } = await supabase
    .from("review_comments")
    .insert({ user_id: userId, review_id: reviewId, body })
    .select()
    .single();
  if (error) throw error;

  // Bump denormalized count
  await supabase.rpc("increment_review_comment_count", {
    review_id_input: reviewId,
  });

  return data;
}

export async function deleteReviewComment(userId, commentId) {
  const { error } = await supabase
    .from("review_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId);
  if (error) throw error;
}
