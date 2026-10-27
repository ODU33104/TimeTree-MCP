# LIMITED-ACTIONS-VERIFY — one-run validation dispatch (2026-10-27)

## Authority and budget
The project owner authorizes **one** tightly scoped GitHub Actions validation run, not blanket CI enablement. Coordinator/worker must not trigger a workflow until confirming it is manual-only, does not cascade into existing workflows, and covers the exact current SHAs. Stop if unable to prove those conditions. Never push main or integration/release-candidate, merge, deploy, publish, or use secrets.

## Scope
Review current PR #25 (QA branch based on PR #24), #26, #27, their claims and reports. #25 is not directly mergeable into release candidate. Preserve source ownership and report unresolved issues (IANA DST semantics, provider adapter authorization, paging completeness). Test synthetic data only. Read latest PR heads again immediately before preparing the run.

## Minimal verification plan
Use a **temporary isolated branch** based on integration/release-candidate; incorporate the changes under test without merging to integration or main, taking care that PR #25 depends on #24 and must not be silently flattened into a release claim. Document exact source SHAs and any integration conflicts. Add a **temporary manual-only workflow** (`workflow_dispatch` only, no push/PR/schedule triggers), Linux GitHub-hosted runner, Node 22, one job, timeout 10 minutes, concurrency cancellation, read-only contents permission, no matrix, no cache requirement, no artifact upload, no secret access. Commands: `npm ci`, `npm run typecheck`, `npm run test:build`, targeted `node --test` for the three QA files, and `npm audit --audit-level=high` if feasible within time. Validate package scripts and test paths before dispatch. Prefer a single sequential job with failure summaries and no unnecessary full-suite duplication.

## Critical trigger gate
GitHub `workflow_dispatch` availability may require the workflow file to exist on the default branch. **Do not modify main to work around this**, and do not trigger a broad existing workflow (CI matrix, Release QA, or Release). If the temporary manual-only workflow cannot be dispatched safely from its isolated branch, mark BLOCKED and report the smallest safe alternative for explicit coordinator approval. Do not repeatedly retry. No workflow run has been authorized beyond the single validated run.

## Execution ownership and reporting
Any arbitrary worker session must inspect latest QUEUE/claims/PRs before acting. Existing owner keeps code ownership; an unclaimed validation-only coordination task may be claimed atomically on the coordination branch. If already claimed, do not steal it: perform non-mutating review and report. No unowned production edits.

Before dispatch, write a preflight record with exact branch, SHA, workflow trigger, job count, commands, and predicted billed minutes. Check no existing run already covers the SHA. Execute **at most one** manual run after the gates pass, with no automatic retry. Capture run URL, job status, logs, elapsed minutes, exact test counts, PASS/FAIL/NOT RUN, and blockers in a GitHub report. On failure, stop, diagnose logs, and request new approval before any second run. Do not claim tests passed based on authored test files. Do not leave a persistent push-trigger workflow.

No user credentials, real calendars, paid runners, deployment, publishing, or main merge.
