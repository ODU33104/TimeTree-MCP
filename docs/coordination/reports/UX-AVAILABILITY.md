# UX-AVAILABILITY report

Branch: `work/ux-availability`

## Changed files
- `src/features/availability/index.ts`: read-only multi-calendar free/busy slots, explicit timezone instants, local working-hours filtering and bounded requests.
- `tests/ux-availability.test.mjs`: conflicts, calendar filtering, working hours and invalid input fixtures.

## Commits
- https://github.com/ODU33104/TimeTree-MCP/commit/9633225037ec8cab727258516302b5102188f42b
- https://github.com/ODU33104/TimeTree-MCP/commit/a97a781207e21b8101310d8cf51a3c7d3604da1d

## Tests and risks
Tests authored but **not executed**; typecheck not executed. No credentials or live calendar used. No MCP tool registration: coordinator must integrate after QA. Search uses 1-minute working-hours checks and is capped at 31 days; large requests can be expensive. Inputs require explicit-offset timestamps and pre-expanded busy intervals; all-day/recurrence expansion remains a caller responsibility.
