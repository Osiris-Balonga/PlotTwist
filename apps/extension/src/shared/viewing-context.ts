export type Platform = "netflix" | "prime";

export interface ViewingContext {
  platform: Platform;
  contentId?: string;
  title?: string;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  currentTimeSeconds: number;
  durationSeconds?: number;
  url: string;
  locale: string;
}

