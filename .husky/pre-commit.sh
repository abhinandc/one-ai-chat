#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm preflight
pnpm lint
pnpm typecheck
# Run impacted unit tests quickly (falls back to full if impacted cannot resolve)
pnpm exec vitest --reporter=dot --changed || pnpm test
