import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatScore = (s) => (s == null ? "—" : Number(s).toFixed(1));

export const formatCount = (n) =>
  !n ? "0" : Intl.NumberFormat("en", { notation: "compact" }).format(n);

export const formatDuration = (min) => {
  if (!min) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

export const SEASONS = ["winter", "spring", "summer", "fall"];

export function getCurrentSeason(date = new Date()) {
  const m = date.getMonth();
  if (m <= 1) return "winter";
  if (m <= 4) return "spring";
  if (m <= 7) return "summer";
  return "fall";
}

export function getSeasonContext(date = new Date()) {
  // Return the current season; if we're in the last ~3 weeks of a season,
  // return the next one so we surface upcoming shows.
  const season = getCurrentSeason(date);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const seasonEndMonths = { winter: 2, spring: 5, summer: 8, fall: 11 };
  const isLateInSeason = month === seasonEndMonths[season] && day >= 15;

  if (!isLateInSeason) return { season, year };

  const order = ["winter", "spring", "summer", "fall"];
  const idx = order.indexOf(season);
  const nextIdx = (idx + 1) % 4;
  return {
    season: order[nextIdx],
    year: nextIdx === 0 ? year + 1 : year,
  };
}
