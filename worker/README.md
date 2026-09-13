# Van Su AI — AI proxy worker (optional)

Minimal Cloudflare Worker (or any HTTP endpoint) that proxies to Workers AI / OpenAI.

## Contract

`POST /` (or your path)

```json
// Request
{
  "type": "horoscope" | "chat",
  "profile": { "birthDate": "YYYY-MM-DD", "birthTime?": "...", "displayName?": "..." },
  "date?": "ISO-8601",
  "message?": "user chat text"
}

// Response 200
{ "text": "Tiếng Việt…", "model?": "string" }
```

Header: `Authorization: Bearer <shared secret>` — same value as app `EXPO_PUBLIC_AI_API_KEY`.

## Env (Worker secrets — NEVER in Expo client as service keys beyond the shared bearer)

| Secret | Mô tả |
|--------|--------|
| `AI_API_KEY` | Shared bearer the app sends (`EXPO_PUBLIC_AI_API_KEY`) |
| `OPENAI_API_KEY` | Optional OpenAI |
| `CF_ACCOUNT_ID` / Workers AI binding | Optional Workers AI |

## Deploy sketch

```bash
cd worker
npx wrangler deploy   # after editing wrangler.toml + index.js
```

Point the app:

```bash
EXPO_PUBLIC_AI_API_URL=https://van-su-ai-proxy.<you>.workers.dev
EXPO_PUBLIC_AI_API_KEY=your-shared-bearer
```

If Worker is too heavy for now, keep the client on mock and document the URL for pilot.
