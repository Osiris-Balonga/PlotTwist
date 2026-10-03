# PlotTwist

PlotTwist is a Chrome extension that interrupts Netflix and Prime Video playback with playful quizzes built around intentional future spoilers.

## Applications

- `apps/extension` — Manifest V3 Chrome extension injected into Netflix and Prime Video.
- `apps/api` — HTTP proxy for configurable OpenAI-compatible quiz generation and request limiting.

## Principles

- AI provider keys stay exclusively on the server.
- Viewing context is limited to the minimum data required.
- A quiz deliberately reveals part of a canonical future event in its question, and the answer completes the spoiler.
- The extension UI and generated quiz content are localized to the viewer's language.
- Each browser installation receives at most one spoiler per episode and three delivered spoilers per local day.
- The API applies a second configurable daily request limit to each anonymous installation identifier. Its in-memory limiter is intended as a development baseline; a shared durable store is required for horizontally scaled production deployments.

## Development

Install dependencies once:

```bash
npm install
```

Initialize private encrypted storage and start the API:

```bash
npm run setup:storage
npm run dev -w @plottwist/api
```

Each user supplies their own provider key and model through the extension settings.
The server no longer uses a shared LLM key from environment variables.

Build the Chrome extension:

```bash
npm run build -w @plottwist/extension
```

Load `apps/extension/dist` as an unpacked extension from `chrome://extensions` with Developer mode enabled. The development proxy defaults to `http://localhost:8787`.

Run the available validation suite:

```bash
npm test
npm run check
npm run build
```

## Extension settings

Click the extension icon to enable or disable PlotTwist, see today's delivered
spoiler count, or open **Paramètres**. The settings page controls spoiler intensity,
quiz timing, the daily allowance (1–3), language, and supported platforms. Changes
apply to open streaming tabs after saving. One spoiler per episode remains enforced.

The service address is fixed at build time by the publisher (`VITE_API_URL`).
Users never configure servers, deployments or administration tokens.

### Personal AI connection

The connection section is always visible: choose a provider, add your personal API
key, or select a suggested model first. Entering a key refreshes the list with the
models available to the account. Saving always validates the selected model against
that account. The refresh icon replaces an
existing key. Connection testing checks authentication and model availability;
listing does not guarantee structured quiz generation support.

The shared provider catalogue currently includes OpenAI, DeepSeek, Kimi (Moonshot
international API), Google Gemini, Mistral, Groq and OpenRouter. UI labels and server
endpoints use the same registry in `packages/providers`; model IDs are fetched live
rather than pinned to specific releases. Each service needs its own API key.
OpenRouter exposes additional model vendors through an OpenRouter key.

Chrome owns the toolbar popup's outer frame. CSS rounds the extension's content
surface only; it cannot override the native window shape. The visible square outer
frame on some Chrome/Windows configurations is not an extension cache issue.

Each installation has an invisible random connection credential. Its personal key
is stored separately on the server using AES-256-GCM, and is never returned to the
browser. The connection credential stays in trusted extension storage, inaccessible
to streaming-page scripts. Provider requests use fixed HTTPS endpoints and reject
redirects. Keys are not synced through Chrome. Removing the key deletes it from the
active server store and invalidates cached quizzes; server backups follow the
operator's retention policy. Clearing history preserves today's delivery counter.

The operator configures encrypted storage once; local development uses
`npm run setup:storage`, hosted deployments follow [the production guide](docs/production.md).
