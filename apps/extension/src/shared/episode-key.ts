import type { ViewingContext } from "./viewing-context";

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function buildEpisodeKey(context: ViewingContext): string {
  const coordinates = context.season && context.episode ? `:s${context.season}:e${context.episode}` : "";
  if (context.contentId) return `${context.platform}:${normalize(context.contentId)}${coordinates}`;

  const title = normalize(context.title ?? "unknown-title");
  const episodeTitle = context.episodeTitle ? `:${normalize(context.episodeTitle)}` : "";
  return `${context.platform}:${title}${coordinates}${episodeTitle}`;
}
