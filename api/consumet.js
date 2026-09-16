// api/consumet.js
import { ANIME } from "@consumet/extensions";

const providers = {
  gogoanime: new ANIME.Gogoanime(),
  zoro: new ANIME.Zoro(),
  animepahe: new ANIME.AnimePahe(),
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

  // Query params:
  //   ?provider=gogoanime&action=search&q=naruto
  //   ?provider=gogoanime&action=info&id=naruto
  //   ?provider=gogoanime&action=watch&episodeId=naruto-episode-1
  //   ?provider=gogoanime&action=servers&episodeId=naruto-episode-1
  const provider = req.query.provider || "gogoanime";
  const action = req.query.action;

  const impl = providers[provider];
  if (!impl) {
    return res.status(400).json({
      error: `Unknown provider: ${provider}`,
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
    console.error("[consumet]", { provider, action, message: err.message });
    return res.status(500).json({
      error: err.message || "Consumet fetch failed",
      provider,
      action,
    });
  }
}
