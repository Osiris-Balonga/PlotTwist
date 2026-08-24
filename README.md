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

Start the API with an OpenAI-compatible LLM provider:

```bash
set LLM_API_KEY=your_key
set LLM_BASE_URL=https://api.example.com/v1
set LLM_MODEL=your-model-id
set QUIZ_DAILY_REQUEST_LIMIT=10
npm run dev -w @plottwist/api
```

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
