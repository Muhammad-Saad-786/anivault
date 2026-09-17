// src/lib/api/lists.js
import { supabase } from "@/lib/supabase";

/* ---------------- Reads ---------------- */

export async function getUserLists(userId) {
  const { data, error } = await supabase
    .from("custom_lists")
    .select(
      `
      id, name, description, is_public, cover_url, created_at,
      item_count:custom_list_items(count)
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((l) => ({
    ...l,
    item_count: l.item_count?.[0]?.count || 0,
  }));
}

export async function getPublicLists(userId, limit = 12) {
  const { data: lists, error } = await supabase
    .from("custom_lists")
    .select("id, name, description, cover_url, created_at")
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!lists?.length) return [];

  // Get item counts + first anime poster for each list
  const listIds = lists.map((l) => l.id);

  const { data: items, error: iErr } = await supabase
    .from("custom_list_items")
    .select("list_id, position, anime_id")
    .in("list_id", listIds)
    .order("position", { ascending: true });

  if (iErr) throw iErr;

  // Get anime posters for the first item of each list
  const animeIds = [...new Set((items || []).map((i) => i.anime_id))];
  let animeMap = new Map();
  if (animeIds.length) {
    const { data: anime } = await supabase
      .from("anime_cache")
      .select("id, poster_url")
      .in("id", animeIds);
    animeMap = new Map((anime || []).map((a) => [a.id, a]));
  }

  return lists.map((l) => {
    const listItems = (items || []).filter((i) => i.list_id === l.id);
    const firstAnime = listItems[0]
      ? animeMap.get(listItems[0].anime_id)
      : null;

    return {
      ...l,
      item_count: listItems.length,
      poster_url: l.cover_url || firstAnime?.poster_url || null,
    };
  });
}

export async function getList(listId) {
  // 1. The list itself + owner
  const { data: list, error } = await supabase
    .from("custom_lists")
    .select("*")
    .eq("id", listId)
    .maybeSingle();

  if (error) throw error;
  if (!list) return null;

  // 2. Owner profile
  const { data: owner } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("id", list.user_id)
    .maybeSingle();

  // 3. List items + anime
  const { data: items, error: iErr } = await supabase
    .from("custom_list_items")
    .select("position, added_at, anime_id")
    .eq("list_id", listId)
    .order("position", { ascending: true });

  if (iErr) throw iErr;

  let enrichedItems = [];
  if (items?.length) {
    const animeIds = items.map((i) => i.anime_id);
    const { data: anime } = await supabase
      .from("anime_cache")
      .select(
        "id, title_en, title_romaji, poster_url, episodes, type, year, score, anilist_id",
      )
      .in("id", animeIds);

    const animeMap = new Map((anime || []).map((a) => [a.id, a]));
    enrichedItems = items.map((i) => ({
      ...i,
      anime: animeMap.get(i.anime_id) || null,
    }));
  }

  return {
    ...list,
    owner: owner || null,
    items: enrichedItems,
  };
}

/* ---------------- Writes ---------------- */

export async function createList(userId, { name, description, isPublic }) {
  const { data, error } = await supabase
    .from("custom_lists")
    .insert({
      user_id: userId,
      name,
      description: description || null,
      is_public: isPublic ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateList(listId, userId, patch) {
  const { data, error } = await supabase
    .from("custom_lists")
    .update(patch)
    .eq("id", listId)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteList(listId, userId) {
  const { error } = await supabase
    .from("custom_lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function addToList(listId, animeId, position = 0) {
  const { error } = await supabase
    .from("custom_list_items")
    .insert({ list_id: listId, anime_id: animeId, position });
  // Ignore duplicate PK
  if (error && error.code !== "23505") throw error;
}

export async function removeFromList(listId, animeId) {
  const { error } = await supabase
    .from("custom_list_items")
    .delete()
    .eq("list_id", listId)
    .eq("anime_id", animeId);
  if (error) throw error;
}

/**
 * Set of list IDs the given anime belongs to (for "already added" state).
 */
export async function getListsContaining(userId, animeId) {
  const { data, error } = await supabase
    .from("custom_list_items")
    .select("list_id, list:custom_lists!inner(user_id)")
    .eq("anime_id", animeId)
    .eq("list.user_id", userId);
  if (error) throw error;
  return new Set((data || []).map((i) => i.list_id));
}

/**
 * Discover page — public lists from all users.
 * Optionally exclude one user (usually the current user).
 */
export async function getDiscoverLists({
  excludeUserId,
  search,
  sort = "newest", // 'newest' | 'popular'
  limit = 24,
  offset = 0,
} = {}) {
  let query = supabase
    .from("custom_lists")
    .select("id, name, description, cover_url, is_public, created_at, user_id")
    .eq("is_public", true)
    .range(offset, offset + limit - 1);

  if (excludeUserId) query = query.neq("user_id", excludeUserId);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  query = query.order("created_at", { ascending: false });

  const { data: lists, error } = await query;
  if (error) throw error;
  if (!lists?.length) return [];

  // Fetch owners
  const ownerIds = [...new Set(lists.map((l) => l.user_id))];
  const { data: owners } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", ownerIds);
  const ownerMap = new Map((owners || []).map((o) => [o.id, o]));

  // Fetch all items to compute counts + cover posters
  const listIds = lists.map((l) => l.id);
  const { data: items } = await supabase
    .from("custom_list_items")
    .select("list_id, position, anime_id")
    .in("list_id", listIds)
    .order("position", { ascending: true });

  const animeIds = [...new Set((items || []).map((i) => i.anime_id))];
  let animeMap = new Map();
  if (animeIds.length) {
    const { data: anime } = await supabase
      .from("anime_cache")
      .select("id, poster_url")
      .in("id", animeIds);
    animeMap = new Map((anime || []).map((a) => [a.id, a]));
  }

  const enriched = lists.map((l) => {
    const listItems = (items || []).filter((i) => i.list_id === l.id);
    const firstAnime = listItems[0]
      ? animeMap.get(listItems[0].anime_id)
      : null;
    return {
      ...l,
      owner: ownerMap.get(l.user_id) || null,
      item_count: listItems.length,
      poster_url: l.cover_url || firstAnime?.poster_url || null,
    };
  });

  if (sort === "popular") {
    enriched.sort((a, b) => b.item_count - a.item_count);
  }

  return enriched;
}
