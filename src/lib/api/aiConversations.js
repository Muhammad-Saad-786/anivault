// src/lib/api/aiConversations.js
import { supabase } from "@/lib/supabase";

export async function loadConversation(userId, animeId) {
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("anime_id", animeId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveConversation({
  userId,
  animeId,
  messages,
  spoilerLevel = "none",
  spoilerUpTo = 0,
}) {
  const payload = {
    user_id: userId,
    anime_id: animeId,
    messages,
    spoiler_level: spoilerLevel,
    spoiler_up_to: spoilerUpTo,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("ai_conversations")
    .upsert(payload, { onConflict: "user_id,anime_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function clearConversation(userId, animeId) {
  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("user_id", userId)
    .eq("anime_id", animeId);
  if (error) throw error;
}
