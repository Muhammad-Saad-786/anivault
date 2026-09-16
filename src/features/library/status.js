import type { AnimeStatus } from "../../types/anime";

export function isLibraryStatus(value: string): value is AnimeStatus {
  return [
    "watching",
    "completed",
    "plan_to_watch",
    "on_hold",
    "dropped",
  ].includes(value);
}
