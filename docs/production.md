# Production workflow

## Branches

- `dev` is the default development branch.
- `main` is the protected production branch.
- Production pull requests must originate from `dev`.
- Direct pushes, force pushes, and branch deletion are disabled on `main`.

Feature branches target `dev`. After validation, promote the complete development branch through a `dev` to `main` pull request. Merge `main` back into `dev` after each production release so both branches retain the production merge commit.

## Required checks

The `Quality gates` check runs tests, type checks, and both workspace builds. The `Production source policy` check rejects pull requests to `main` that do not originate from `dev`.

## Vercel configuration

The API requires the following server-side environment variables in Vercel:

- `LLM_API_KEY`
- `LLM_BASE_URL`
- `LLM_MODEL`
- `QUIZ_DAILY_REQUEST_LIMIT` (optional)

Never put these values in repository variables, source code, logs, or extension builds. Configure them directly in the Vercel project and regenerate any key previously shared in a chat or other public channel.

## Chrome Web Store package

Set the public GitHub repository variable `PLOTTWIST_API_URL` to the production HTTPS endpoint, including `/v1/quiz`. The `Package Chrome extension` workflow builds an archive whose root contains `manifest.json`, ready for upload to the Chrome Web Store developer dashboard.

Store submission remains a manual release step because it requires the owner's Chrome Web Store developer account, listing declarations, screenshots, and final publishing confirmation. Use the deployed `/privacy` page as the listing privacy-policy URL.
