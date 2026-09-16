export function getProgress(episodesWatched: number, episodesTotal?: number) {
  return episodesTotal
    ? Math.min(100, Math.round((episodesWatched / episodesTotal) * 100))
    : 0;
}
