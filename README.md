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

Each application will add its development commands with its first functional milestone.
