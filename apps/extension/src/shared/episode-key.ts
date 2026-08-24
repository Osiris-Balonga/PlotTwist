import type { ViewingContext } from "./viewing-context";

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function buildEpisodeKey(context: ViewingContext): string {
  if (context.contentId) return `${context.platform}:${normalize(context.contentId)}`;

  const coordinates = context.season && context.episode ? `:s${context.season}:e${context.episode}` : "";
  const title = normalize(context.title ?? "unknown-title");
  const episodeTitle = context.episodeTitle ? `:${normalize(context.episodeTitle)}` : "";
  return `${context.platform}:${title}${coordinates}${episodeTitle}`;
}
