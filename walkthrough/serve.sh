#!/bin/bash
# Serves a production build of a scratch COPY of the app on :3200 for the walkthrough recording,
# so the owner's own dev server and .next are never touched.
set -e
R=/home/testys/Documents/GitHub/Intellign-frontend
V=/tmp/walk-app
rm -rf "$V" && mkdir -p "$V"
cp -r "$R/src" "$R/public" "$R/package.json" "$R/tsconfig.json" "$R/next.config.ts" "$R/postcss.config.mjs" "$R/next-env.d.ts" "$V/"
# Copy the repo env, then force the API to the LOCAL isolated backend so the recording never talks to production.
[ -f "$R/.env.local" ] && cp "$R/.env.local" "$V/.env.local"
touch "$V/.env.local"
sed -i '/^NEXT_PUBLIC_API_URL=/d;/^NEXT_PUBLIC_DEV_BYPASS=/d' "$V/.env.local"
printf 'NEXT_PUBLIC_API_URL=http://localhost:8000\nNEXT_PUBLIC_DEV_BYPASS=false\n' >> "$V/.env.local"
ln -s "$R/node_modules" "$V/node_modules"
cd "$V"
npx next build > /tmp/walk-build.log 2>&1
echo "BUILD_DONE" >> /tmp/walk-build.log
exec npx next start -p 3200
