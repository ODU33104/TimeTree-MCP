#!/usr/bin/env bash
# Run only in a network-enabled local checkout. Never starts GitHub Actions.
set -euo pipefail
test -f package-lock.json || { echo "Run at repository root"; exit 2; }
test "$(git branch --show-current)" != "main" || { echo "Refusing to change main"; exit 2; }
test -z "$(git status --porcelain)" || { echo "Start with a clean working tree"; exit 2; }
node --version
npm --version
npm ci
npm audit --json > dependency-audit-before.json || true
npm ls body-parser zod fast-uri ip-address esbuild || true
# Compatible fixes only; never use --force (which can upgrade Zod across major versions).
npm audit fix
npm ci
npm run typecheck
npm run build
npm test
npm audit --audit-level=high
echo "Local verification complete. Review package.json and package-lock.json before committing."
echo "Keep dependency-audit-before.json local; do not commit it."
