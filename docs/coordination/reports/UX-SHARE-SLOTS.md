# UX-SHARE-SLOTS report
status: ready-for-review
branch: task/UX-SHARE-SLOTS-20261026
date: 2026-10-26

## Changes
- src/features/share-slots/index.ts: explicit opt-in, expiration, UTC-normalized busy-only merging and clipping, metadata exclusion
- tests/ux-share-slots.test.mjs: opt-in, expiration, redaction, merging, clipping, invalid timestamp cases

## Commits
- https://github.com/ODU33104/TimeTree-MCP/commit/1894722e37cc42ac741ad59c2b492b481c293645
- https://github.com/ODU33104/TimeTree-MCP/commit/de78d41c87cc0f5ed78027386b8dc37003f298e5

## Test status
Not executed; requires build/typecheck/test gate by coordinator.

## Risks and handoff
- Expiry is metadata only: consumers MUST check isShareExpired before display/access; it is not revocation of already copied data.
- No shareable URL, remote persistence, authentication or calendar tool registration implemented.
- Input must be trusted normalized busy/free blocks; titles and attendees are intentionally discarded.
- Coordinator integration required; no changes to owned registry or main.
