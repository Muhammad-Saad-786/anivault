// test-consumet.mjs
import { ANIME } from "@consumet/extensions";

const candidates = [
  "Hianime",
  "AnimePahe",
  "AnimeKai",
  "KickAssAnime",
  "AnimeSaturn",
  "AnimeUnity",
  "AnimeSama",
];

const TIMEOUT = 20000;

async function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms),
    ),
  ]);
}

for (const name of candidates) {
  console.log(`\n=== ${name} ===`);
  try {
    const P = ANIME[name];
    if (!P) {
      console.log("  ✗ Not exported");
      continue;
    }
    const provider = new P();

    const t0 = Date.now();
    const results = await withTimeout(provider.search("naruto"), TIMEOUT);
    const ms = Date.now() - t0;

    const count = results?.results?.length ?? 0;
    console.log(`  ✓ Search OK in ${ms}ms — ${count} results`);
    if (count > 0) {
      const first = results.results[0];
      console.log(`  → Sample: ${first.title} (id: ${first.id})`);
    }
  } catch (err) {
    console.log(`  ✗ ${err.message}`);
  }
}

console.log("\nDone.");
