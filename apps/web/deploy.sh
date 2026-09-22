#!/bin/bash
set -e
echo "== NagarGo web deploy =="
echo "This must be run from inside apps/web (checking...)"
if [ ! -f "next.config.js" ] && [ ! -f "next.config.mjs" ]; then
  echo "ERROR: run this from inside NagarGo/apps/web, not the repo root."
  exit 1
fi

MAPS_KEY=$(grep '^NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=' .env.local | cut -d '=' -f2-)
if [ -z "$MAPS_KEY" ]; then
  echo "ERROR: couldn't read NEXT_PUBLIC_GOOGLE_MAPS_API_KEY from .env.local"
  exit 1
fi

read -p "API URL (press Enter to use http://localhost:4000/api for now): " API_URL
API_URL=${API_URL:-http://localhost:4000/api}

echo "== First deploy (creates the project) =="
npx vercel --prod --yes

echo "== Setting environment variables =="
echo "$API_URL" | npx vercel env add NEXT_PUBLIC_API_URL production
echo "$MAPS_KEY" | npx vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production

echo "== Redeploying with env vars baked in =="
npx vercel --prod --yes

echo "== Done. Open the URL printed above. =="
