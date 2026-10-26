# TOOLS workstream report

## 2026-10-26 — Milestone 1: calendar identifier validation

- Branch: `work/tool-quality` (created from `main`).
- Changed `src/tools/shared-schemas.ts`: reject zero, leading-zero string IDs, and integer values outside JavaScript's safe integer range before converting to Number. This prevents silent ID rounding when passing IDs returned by tools to mutation APIs.
- Commit: https://github.com/ODU33104/TimeTree-MCP/commit/2a16ba630266420fcc999f6aa0c250bd7e65805c
- Changed `src/tools/recurring-event-tools.ts`: reject timezone-less occurrence timestamps, fractional milliseconds and dates outside JavaScript Date's supported range before any mutation.
- Commit: https://github.com/ODU33104/TimeTree-MCP/commit/0c4cd93addbf9791e7dfeabd161e9c8c618a6404
- Tests: NOT RUN. Build/typecheck and regression suite remain unverified.
- Compatibility assumption: Calendar IDs are positive decimal integer strings without leading zeros; verify against real API response fixtures before integration. If leading zeros are valid identifiers, relax the regex while retaining safe-integer validation.
- Next: recurring occurrence timestamp validation, recurrence edge-case contract tests, and mutation safety review.
- Coordinator: review compatibility and merge only after QA gate. No credentials requested; no main merge.

## 2026-10-26 — Milestone 2: contract regression coverage

- Added regression tests in `tests/recurring-tools.test.mjs` for ambiguous timezone-less timestamps, invalid numeric instants, and explicitly offset timestamps. Commit: https://github.com/ODU33104/TimeTree-MCP/commit/b5d35c29d33dc47dc3a136eadd93e041180f7fe3
- Added calendar identifier schema boundary tests in `tests/tools.test.mjs`. Commit: https://github.com/ODU33104/TimeTree-MCP/commit/815b29b540c791a33b6d5567e334ecf7e6941350
- Tests: NOT RUN; test code is committed but not verified by CI or locally. Coordinator must run build, typecheck, and tests.
- Compatibility risk: strict timezone requirement may reject formerly accepted local timestamps; this is intentional for safe writes. Check callers and document explicit ISO offsets.
- Next: audit remaining mutation paths and recurrence splitting edge cases.
