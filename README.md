# PlotTwist

PlotTwist is a Chrome extension that enriches Netflix and Prime Video with progressive, spoiler-aware quizzes.

## Applications

- `apps/extension` — Manifest V3 Chrome extension injected into Netflix and Prime Video.
- `apps/api` — HTTP proxy for metadata, quiz generation, and spoiler policy enforcement.

## Principles

- AI provider keys stay exclusively on the server.
- Viewing context is limited to the minimum data required.
- A quiz must never reveal events beyond the allowed season, episode, or timestamp.
- The extension UI and generated quiz content are localized to the viewer's language.

## Development

Install dependencies once:

```bash
npm install
```

Start the API with a DeepSeek key:

```bash
set DEEPSEEK_API_KEY=your_key
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
