# Deploying NagarGo

## Why you got a 404 on Vercel

That `404: NOT_FOUND` page is Vercel's own error, not a bug in
NagarGo — it means Vercel looked for a deployable app and didn't
find one. This repo is a **monorepo**: the Next.js app lives in
`apps/web`, not at the repo root. If you connected the repo (or
uploaded the zip) to Vercel without telling it that, Vercel tried to
build from the root, found no Next.js project there, and served this
404 instead.

Separately: **the API (`apps/api`) cannot run on Vercel at all**,
regardless of configuration. Vercel runs your code as short-lived
serverless functions. This API needs a real, persistent Node
process because it:
- keeps live Socket.IO WebSocket connections open (rider tracking,
  notifications) — serverless functions can't hold a connection open
- runs a background loop every 15 seconds (`dispatchScheduler.ts`)
  that auto-assigns riders — serverless functions don't keep running
  between requests
- keeps a pooled MongoDB connection alive — reconnecting on every
  cold start would be slow and unreliable

So the correct split is: **web → Vercel, API → Render (or Railway/
Fly.io/a VPS)**. Below is the exact path for Vercel + Render, since
Render's free tier supports both requirements above out of the box.

## Step 1 — MongoDB Atlas (already done for you)

A free MongoDB Atlas cluster has already been created and is live:
project **NagarGo**, cluster **nagargo-cluster** (AWS, us-east-1),
database user `nagargo_api` with read/write access to the
`nagargo_prod` database, network access opened for any IP (needed
since Render's outbound IP isn't static on the free tier). The real
connection string is already filled in as `MONGODB_URI` in both
`.env` and `apps/api/.env` in this zip — nothing to do here.

## Step 2 — Deploy the API to Render

1. Push this repo to your own GitHub/GitLab, or use Render's "deploy
   from a zip"/manual upload option if you're not using git yet.
2. In the Render dashboard: **New → Blueprint**, point it at this
   repo — it will read `render.yaml` at the repo root and set up the
   `nagargo-api` service automatically (root directory, build/start
   commands, and a persistent disk for uploads are already
   configured there).
3. In the Render service's **Environment** tab, fill in the env vars
   `render.yaml` left blank — copy every value directly from
   `apps/api/.env` in this zip: `MONGODB_URI` (the Atlas string from
   Step 1), `JWT_SECRET` / `JWT_REFRESH_SECRET`, `ADMIN_BOOTSTRAP_PIN`,
   `GOOGLE_MAPS_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` —
   plus `APP_BASE_URL` (your Vercel URL from Step 3 below,
   comma-separate if you have more than one).
4. Deploy. Once live, note the Render URL
   (`https://nagargo-api.onrender.com` or similar) — you'll need it
   in Step 3. Set `API_BASE_URL` on Render to this same URL once you
   know it, then redeploy so uploaded file URLs point at the right
   place.

## Step 3 — Deploy the web app to Vercel

**Shortcut:** `apps/web/deploy.sh` in this zip runs the entire
sequence below in one command. From inside `apps/web`, run
`./deploy.sh` — it reads your Maps key from `.env.local`
automatically, asks for your API URL once, and deploys twice (the
second time so the env vars actually get baked into the build).

Manual steps, if you'd rather do it by hand or through the dashboard:

1. **New Project** in Vercel, import this repo.
2. This is the step that was missing before: set **Root Directory**
   to `apps/web` (Project Settings → General → Root Directory, or
   the prompt during import). Framework Preset should auto-detect as
   Next.js once the root directory is correct.
3. Add environment variables (Project Settings → Environment
   Variables) — **these must be set in the Vercel dashboard, not
   just in a local `.env.local`**, because Vercel builds in the
   cloud and never sees your local files:
   - `NEXT_PUBLIC_API_URL` = `https://<your-render-url>/api`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = (from `apps/web/.env.local`
     in this zip)
4. Deploy. Once live, copy the Vercel URL and go back to Step 2.3 to
   set `APP_BASE_URL` on Render to it (this is what CORS and
   Socket.IO check against — without it, the browser will get CORS
   errors calling the API).

## Step 4 — Restrict your Maps key to these real domains

In Google Cloud Console, edit the Maps API key's **HTTP referrer
restrictions** to include your actual Vercel domain (and
`localhost:3000` for local testing). It currently has no domain
restriction, which is fine for testing but not for a public launch.

## After both are live

- Visit your Vercel URL — the site should load normally.
- Sign up, then check Admin Panel → Test Telegram to confirm the
  bot is receiving events from the live deployment.
- If you see a CORS error in the browser console, it means
  `APP_BASE_URL` on Render doesn't exactly match your Vercel URL
  (check for a trailing slash or `http` vs `https` mismatch).
