import type { Platform, ViewingContext } from "../../shared/viewing-context";

export interface PlatformAdapter {
  readonly platform: Platform;
  matches(url: URL): boolean;
  getPlayer(): HTMLVideoElement | null;
  getContext(): ViewingContext;
  observeChanges(onChange: () => void): () => void;
}

