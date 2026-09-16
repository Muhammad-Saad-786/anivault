export type AnimeStatus =
  | "watching"
  | "completed"
  | "plan_to_watch"
  | "on_hold"
  | "dropped";

export interface Anime {
  id: number;
  title: string;
  synopsis?: string;
  image?: string;
  score?: number;
  episodes?: number;
  status?: AnimeStatus;
}
