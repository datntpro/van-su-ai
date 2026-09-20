# Van Su AI — Cloudflare Worker AI proxy

Proxy khớp contract `src/lib/ai.ts`. Expo chỉ gửi **Bearer shared key** — **không** đưa Supabase `service_role` vào Worker hay app.

## Contract

`POST /`

```json
// Request
{
  "type": "horoscope" | "chat" | "horoscope_intake",
  "profile": { "birthDate": "YYYY-MM-DD", "birthTime?": "...", "displayName?": "..." },
  "traits?": { "gender?": "...", "career?": "...", "concerns?": ["..."] },
  "date?": "ISO-8601",
  "message?": "user chat text",
  "history?": [{ "role": "user"|"assistant", "content": "..." }],
  "systemPrompt?": "optional override",
  "skipIntake?": false
}

// Response 200
{ "text": "Tiếng Việt…", "model?": "string", "traits?": {}, "readyForReading?": true, "birthTime?": "HH:mm" }
```

Header: `Authorization: Bearer <shared secret>` = app `EXPO_PUBLIC_AI_API_KEY`.

`GET /` → health + contract note.

## Upstream

| Mode | When |
|------|------|
| OpenAI-compatible | `OPENAI_API_KEY` set (`AI_PROVIDER=openai` or `auto`) |
| Workers AI | `AI` binding + no OpenAI key, or `AI_PROVIDER=workers` |
| Stub local | Neither upstream works — still returns Vietnamese entertainment text + disclaimer |

Prompts are Vietnamese entertainment-horoscope (tử vi / lịch vạn sự). Worker strips accidental `service_role` fields from JSON body.

## Deploy

```bash
# 1) Cloudflare account + wrangler login
npm i -g wrangler   # or npx
cd worker
npx wrangler login

# 2) Shared bearer (same value you put in Expo)
npx wrangler secret put AI_API_KEY
# paste a long random string (NOT OpenAI key, NOT service_role)

# 3a) Option A — OpenAI / compatible
npx wrangler secret put OPENAI_API_KEY
# optional vars already in wrangler.toml: OPENAI_MODEL, OPENAI_BASE_URL

# 3b) Option B — Workers AI only (binding [ai] in wrangler.toml)
# Enable Workers AI on the account; leave OPENAI_API_KEY unset
# or set AI_PROVIDER=workers via wrangler.toml [vars]

# 4) Deploy
npx wrangler deploy
# → https://van-su-ai-proxy.<subdomain>.workers.dev
```

## Point the Expo app

In `.env` (local) or EAS Secrets (store) — **public shared bearer only**:

```bash
EXPO_PUBLIC_AI_API_URL=https://van-su-ai-proxy.<you>.workers.dev
EXPO_PUBLIC_AI_API_KEY=<same-as-AI_API_KEY-secret>
```

Restart Expo. Tab Tử vi / Chat sẽ gọi HTTP thay vì mock (badge MOCK AI biến mất khi API OK).

## Security checklist

- [ ] `AI_API_KEY` ≠ OpenAI key (app exposes bearer via `EXPO_PUBLIC_*`)
- [ ] Never put Supabase `service_role` in Worker secrets unless a separate backend needs it — **this worker does not**
- [ ] Never put `service_role` in Expo `.env`
- [ ] Rotate shared bearer if leaked

## Local dry-run

```bash
npx wrangler dev
curl -s http://127.0.0.1:8787/ -H "Authorization: Bearer $AI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"horoscope","profile":{"birthDate":"1990-01-15"},"date":"2026-09-20"}'
```
