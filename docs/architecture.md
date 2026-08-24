# Architecture PlotTwist

```text
Chrome extension (Manifest V3)
  content script -> viewing context extraction + Shadow DOM UI
  service worker -> secure transport + local cache
        |
        v
API PlotTwist
  validation -> metadata resolution -> spoiler policy enforcement
        |                                      |
        +---------------------> Configured LLM provider
```

## Viewing context contract

```ts
type ViewingContext = {
  platform: "netflix" | "prime";
  contentId?: string;
  title?: string;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  currentTimeSeconds: number;
  durationSeconds?: number;
  url: string;
  locale: string;
};
```

## Localization

The extension derives a locale from the streaming page, browser preferences, and any visible content metadata. UI labels use extension-owned locale catalogs. The API receives the locale and requires DeepSeek to return quiz text in that language while preserving canonical content identifiers.

## Integration strategy

The extension injects one host into `document.body` and mounts its UI in a Shadow DOM. Platform adapters detect the player and SPA transitions without modifying first-party controls.
