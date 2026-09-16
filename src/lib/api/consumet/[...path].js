// api/consumet/[...path].js
// Vercel serverless function — Consumet proxy with no external server.

import { ANIME } from "@consumet/extensions";

// Cache provider instances (they're stateless but reusable)
const providers = {
  gogoanime: new ANIME.Gogoanime(),
  zoro: new ANIME.Zoro(),
  animepahe: new ANIME.AnimePahe(),
  animefox: new ANIME.AnimeFox(),
};

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse route: /api/consumet/anime/gogoanime/naruto
  // req.query.path is an array of segments after /api/consumet
  const path = req.query.path || [];
  const [resource, providerName, ...rest] = path;

  if (resource !== "anime") {
    return res.status(400).json({ error: "Only /anime is supported" });
  }

  const provider = providers[providerName];
  if (!provider) {
    return res.status(400).json({
      error: `Unknown provider: ${providerName}`,
      available: Object.keys(providers),
    });
  }

  try {
    // ---- Search: /anime/gogoanime/naruto
    if (rest.length === 1) {
      const query = decodeURIComponent(rest[0]);
      const data = await provider.search(query);
      res.setHeader(
        "Cache-Control",
        "s-maxage=3600, stale-while-revalidate=86400",
      );
      return res.status(200).json(data);
    }

    // ---- Info: /anime/gogoanime/info/{id}
    if (rest[0] === "info" && rest[1]) {
      const id = decodeURIComponent(rest[1]);
      const data = await provider.fetchAnimeInfo(id);
      res.setHeader(
        "Cache-Control",
        "s-maxage=1800, stale-while-revalidate=3600",
      );
      return res.status(200).json(data);
    }

    // ---- Watch: /anime/gogoanime/watch/{episodeId}
    if (rest[0] === "watch" && rest[1]) {
      const episodeId = decodeURIComponent(rest[1]);
      const data = await provider.fetchEpisodeSources(episodeId);
      return res.status(200).json(data);
    }

    // ---- Servers: /anime/gogoanime/servers/{episodeId}
    if (rest[0] === "servers" && rest[1]) {
      const episodeId = decodeURIComponent(rest[1]);
      const data = await provider.fetchEpisodeServers(episodeId);
      return res.status(200).json(data);
    }

    // ---- Recent episodes: /anime/gogoanime/recent
    if (rest[0] === "recent") {
      const data = await provider.fetchRecentEpisodes();
      res.setHeader("Cache-Control", "s-maxage=600");
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: "Unsupported path", path });
  } catch (err) {
    console.error("[consumet error]", {
      provider: providerName,
      path: rest.join("/"),
      message: err.message,
    });
    return res.status(500).json({
      error: err.message || "Consumet fetch failed",
      provider: providerName,
      path: rest.join("/"),
    });
  }
}
