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

The operator configures these server-only values once:

- `PLOTTWIST_CONFIG_ENCRYPTION_KEY`: random 32-byte key, base64 encoded.
- `PLOTTWIST_CONFIG_REDIS_URL`: HTTPS REST endpoint of a dedicated Upstash-compatible Redis database.
- `PLOTTWIST_CONFIG_REDIS_TOKEN`: private REST token for that database.
- `QUIZ_DAILY_REQUEST_LIMIT` (optional).

Users supply their own API keys and models in the extension; no server address,
admin token or deployment settings are exposed to them. There is no shared `LLM_API_KEY`.
Never include storage secrets in extension builds or public repository variables.

Connections are stored separately under `plottwist:connection:v1:<credential-hash>`
as authenticated AES-256-GCM envelopes, bound to each installation identity.
Keep the encryption key separate from the database and preserve it across redeploys.
Rotate it only with a migration of encrypted records. Define backup retention and
access controls for the database; deleting a key removes its active record.

Vercel requires persistent Redis storage; local file storage is disabled there.
A single long-running server can use `PLOTTWIST_CONFIG_DIRECTORY` on a private
persistent volume. `npm run setup:storage` initializes local development. Restrict
`.env` and storage to the server account; on Windows also set appropriate ACLs.

The connection API returns only the provider, model and whether a key exists.
Connection credentials are scoped to one installation and generated automatically.
Provider endpoints are fixed, use HTTPS, reject redirects and enforce timeouts.
The extension accepts connection changes only from trusted extension pages.

## Chrome Web Store package

Set the public GitHub repository variable `PLOTTWIST_API_URL` to the production HTTPS endpoint, including `/v1/quiz`. The `Package Chrome extension` workflow builds an archive whose root contains `manifest.json`, ready for upload to the Chrome Web Store developer dashboard.

Store submission remains a manual release step because it requires the owner's Chrome Web Store developer account, listing declarations, screenshots, and final publishing confirmation. Use the deployed `/privacy` page as the listing privacy-policy URL.
