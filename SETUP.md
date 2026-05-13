# UNKWN — backend setup

This guides you from a fresh clone to a working email-capture endpoint on Vercel.

## 1. Install dependencies

```bash
npm install
```

The backend adds two runtime deps: `@supabase/supabase-js` and `resend`.

## 2. Create the database (Supabase)

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick a region close to your Vercel region. Save the database password somewhere safe (you won't need it for this app — but you'll regret losing it).
3. When the project is ready, open **SQL Editor** → **New query**.
4. Paste the contents of `migrations/001_subscribers.sql` and run it.
5. Open **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (under "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`

> The service-role key bypasses Row-Level Security. **Never** put it in client code or commit it. It only belongs on the server.

## 3. Create the email sender (Resend)

1. Sign up at [resend.com](https://resend.com).
2. **API Keys** → **Create API Key** (Full access). Copy it → `RESEND_API_KEY`.
3. Sender options:
   - **Quick start**: use `onboarding@resend.dev` as `RESEND_FROM_EMAIL`. Works immediately, only sends to your own verified address.
   - **Production**: **Domains** → **Add Domain** → follow the DNS instructions. Once verified, set `RESEND_FROM_EMAIL=UNKWN <hello@yourdomain.com>`.
4. Set `ADMIN_EMAIL` to wherever you want new-signup pings to land.

## 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in every value in `.env.local`. Then for production, copy the same set into **Vercel → Project → Settings → Environment Variables** (Production + Preview + Development).

Pick a long random string for `IP_HASH_SALT`. Example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 5. Run locally

Vercel's CLI runs both Vite and the `/api` functions together:

```bash
npm i -g vercel
vercel link        # one-time, links this folder to your Vercel project
vercel dev
```

Open the URL it prints (usually `http://localhost:3000`). The hero form posts to `/api/subscribe`.

If you'd rather run plain Vite, the API won't be reachable — `vite` alone doesn't serve `/api`. Use `vercel dev` while iterating on the backend.

## 6. Deploy

```bash
git add .
git commit -m "Add email capture backend"
git push
```

Vercel auto-deploys on every push to `main`. First deploy:
1. Push the branch.
2. Vercel build will detect Vite + Serverless Functions automatically.
3. After it's live, confirm env vars are set in **Settings → Environment Variables**, then **Deployments → … → Redeploy** if you added vars after the first build.

## 7. Verify end-to-end

1. Open the live URL, submit your email.
2. You should:
   - Get a 200 from `POST /api/subscribe` (check **Vercel → Functions → Logs**).
   - See a new row in **Supabase → Table Editor → subscribers**.
   - Receive the cyberpunk confirmation email at the address you submitted.
   - Receive an admin notification at `ADMIN_EMAIL`.

## Error codes

The API returns structured JSON errors. The frontend in `AccessTerminal.jsx` maps these to user-facing messages.

| HTTP | `error`              | Meaning |
|------|----------------------|---------|
| 400  | `INVALID_EMAIL`      | Email failed validation (format / disposable domain). |
| 400  | `BAD_REQUEST`        | Body wasn't valid JSON. |
| 403  | `FORBIDDEN`          | Honeypot field was filled — bot. |
| 405  | `METHOD_NOT_ALLOWED` | Anything other than POST/OPTIONS. |
| 429  | `RATE_LIMITED`       | More than 5 requests in 60s from this IP. |
| 500  | `STORAGE_FAILED`     | Supabase insert failed (check logs). |

## Production hardening

The current setup is good for hundreds of signups per day. If you expect volume:

- **Rate limiter** — `server/rateLimit.js` is in-memory and resets when a serverless instance cold-starts. Swap for [Upstash Redis](https://upstash.com) (`@upstash/ratelimit`) for true per-IP enforcement across the fleet.
- **CORS** — set `ALLOWED_ORIGINS` to your real domain(s) in production. With it empty the API allows `*`.
- **Domain auth for email** — Resend's `onboarding@resend.dev` only delivers to your verified address. Add your own domain and configure SPF/DKIM/DMARC before launch, or recipients will see "via resend.dev".
- **CAPTCHA** — for very public launches, add hCaptcha/Turnstile to the form and verify the token in `/api/subscribe`.

## File map

```
api/
  subscribe.js              ← POST endpoint
server/
  validation.js             ← email + tag validation
  rateLimit.js              ← in-memory sliding window
  supabase.js               ← DB client + saveSubscriber()
  emails/
    confirmation.js         ← user-facing confirmation template
    adminNotify.js          ← admin notification template
    send.js                 ← Resend wrapper
migrations/
  001_subscribers.sql       ← schema (run once in Supabase)
.env.example                ← env template — copy to .env.local
```
