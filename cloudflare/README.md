# ZIH Cloud Backend · Phase 1 foundation

This folder contains the first deployable backend foundation for the ZIH AI architecture.
The GitHub Pages site remains static; this Worker is a separate service.

## Included endpoints

- `GET /api/health` — service health check.
- `GET /api/rooms` — chat room list.
- `GET /api/rooms/:roomId/messages?limit=50` — recent messages.
- `POST /api/rooms/:roomId/messages` — create a visitor message (`{ "name": "...", "content": "..." }`).
- `POST /api/ai/chat` — OpenAI-compatible model gateway proxy. API credentials stay in Worker secrets.

## Deploy

1. Install Node.js and Wrangler, then run `npx wrangler login`.
2. Create the D1 database: `npx wrangler d1 create zih-ai-db`.
3. Copy the returned database ID into `wrangler.toml`.
4. Apply schema: `npx wrangler d1 migrations apply zih-ai-db --remote`.
5. Set model gateway secrets only when ready:
   - `npx wrangler secret put MODEL_GATEWAY_URL`
   - `npx wrangler secret put MODEL_GATEWAY_API_KEY`
   - optionally `npx wrangler secret put DEFAULT_MODEL`
6. Deploy: `npx wrangler deploy`.
7. Test `GET https://YOUR-WORKER.workers.dev/api/health`.

Set `ALLOWED_ORIGINS` in `wrangler.toml` to the exact deployed site origin(s). Do not use `*` for a production public chat service.

## Important status

This is a backend foundation, not yet wired into the existing browser chat UI. The current localStorage chat remains unchanged and continues to work. The next integration step will add an explicit backend URL setting, sync status, and opt-in migration/sync so existing local messages are not silently uploaded or overwritten.

Before public launch, add abuse protection (rate limiting / Turnstile), moderation, room authorization, pagination limits, retention policy, and stronger user identity. Public visitor messages are not authenticated in this first foundation. Do not expose Worker secrets in frontend code or commit them to Git.
