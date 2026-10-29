# UX-NATURAL-PARSER work report

Branch: `work/ux-natural-parser`

## Deliverables
- `src/features/natural-date/index.ts`: deterministic Japanese/English relative calendar dates, weekdays, explicit dates, ambiguity states, IANA timezone reference handling and calendar validation.
- `tests/ux-natural-date.test.mjs`: six tests covering Japanese/English, omitted year, ambiguous numeric formats, timezone midnight, US DST and invalid inputs.

## Commits
- https://github.com/ODU33104/TimeTree-MCP/commit/d770fcb0006b95a10a8f05f485c0794e5e5ac438
- https://github.com/ODU33104/TimeTree-MCP/commit/77c85a2dc3bcda2060f30ddf11bd92d943f1866c

## QA / risks
Tests authored but **not executed**; typecheck not executed. Parser intentionally returns a calendar date, not an instant; downstream callers must ask for local time and resolve DST gaps/overlaps. No TimeTree data or credentials used. Supports limited explicit grammar only. No integration into MCP registry.

## Coordinator handoff
Review behavior of `this Monday` after the weekday has passed and confirm policy for locale ambiguity. Integrate only after QA; no `src/index.ts` changes.
