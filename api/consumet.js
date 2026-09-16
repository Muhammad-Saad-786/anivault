// api/consumet.js
import * as Consumet from "@consumet/extensions";

const ANIME = Consumet.ANIME || Consumet.default?.ANIME;

if (!ANIME) {
  console.error("[consumet] ANIME namespace missing", Object.keys(Consumet));
}

// Providers available in current @consumet/extensions
const providers = {
  hianime: new ANIME.Hianime(),
  animepahe: new ANIME.AnimePahe(),
  animekai: new ANIME.AnimeKai(),
  kickassanime: new ANIME.KickAssAnime(),
  animeunity: new ANIME.AnimeUnity(),
  animesaturn: new ANIME.AnimeSaturn(),
};

export const DEFAULT_PROVIDER = "hianime";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const providerName = req.query.provider || DEFAULT_PROVIDER;
  const action = req.query.action;
  const impl = providers[providerName];

  if (!impl) {
    return res.status(400).json({
      error: `Unknown provider: ${providerName}`,
      available: Object.keys(providers),
    });
  }

  try {
    let data;

    switch (action) {
      case "search": {
        const q = req.query.q;
        if (!q) return res.status(400).json({ error: "Missing q" });
        data = await impl.search(q);
        res.setHeader(
          "Cache-Control",
          "s-maxage=3600, stale-while-revalidate=86400",
        );
        break;
      }
      case "info": {
        const id = req.query.id;
        if (!id) return res.status(400).json({ error: "Missing id" });
        data = await impl.fetchAnimeInfo(id);
        res.setHeader("Cache-Control", "s-maxage=1800");
        break;
      }
      case "watch": {
        const episodeId = req.query.episodeId;
        if (!episodeId)
          return res.status(400).json({ error: "Missing episodeId" });
        data = await impl.fetchEpisodeSources(episodeId);
        break;
      }
      case "servers": {
        const episodeId = req.query.episodeId;
        if (!episodeId)
          return res.status(400).json({ error: "Missing episodeId" });
        data = await impl.fetchEpisodeServers(episodeId);
        break;
      }
      default:
        return res.status(400).json({
          error: "Missing or unknown action",
          validActions: ["search", "info", "watch", "servers"],
        });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("[consumet]", {
      provider: providerName,
      action,
      message: err.message,
      stack: err.stack,
    });
    return res.status(500).json({
      error: err.message || "Consumet fetch failed",
      provider: providerName,
      action,
    });
  }
}
