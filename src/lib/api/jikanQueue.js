// Serial queue with min spacing between calls + retry/backoff on 429/5xx.

const MIN_GAP_MS = 400; // ~2.5 req/sec max
const MAX_RETRIES = 0;

let lastCallAt = 0;
let chain = Promise.resolve();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function throttled(task) {
  // Serialize tasks so only one Jikan request is in flight at a time.
  const run = chain.then(async () => {
    const since = Date.now() - lastCallAt;
    if (since < MIN_GAP_MS) await sleep(MIN_GAP_MS - since);
    try {
      return await task();
    } finally {
      lastCallAt = Date.now();
    }
  });
  // Keep the chain alive even if this task throws.
  chain = run.catch(() => {});
  return run;
}

export async function jikanFetch(axiosInstance, url, config = {}) {
  return throttled(async () => {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await axiosInstance.get(url, config);
      } catch (err) {
        const status = err?.response?.status;
        const retriable =
          status === 429 ||
          status === 500 ||
          status === 502 ||
          status === 503 ||
          status === 504 ||
          err?.code === "ECONNABORTED";

        if (!retriable || attempt >= MAX_RETRIES) throw err;

        // Exponential backoff: 800ms, 1600ms, 3200ms
        const wait = 800 * 2 ** attempt;
        attempt += 1;
        await sleep(wait);
      }
    }
  });
}
