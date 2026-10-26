# UNIVERSAL WORKER DISPATCH — execute, do not summarize

**YOU ARE THE IMPLEMENTATION WORKER.** This file is an executable work order for the ChatGPT session receiving this URL, not a document to review or explain. Immediately perform GitHub code edits, commit them and report to Git. Do not tell the user to send the task to another session. Do not ask the user questions.

## Session-agnostic assignment (AUTH, REMOTE, TOOLS, QA)
1. Read `docs/coordination/STATUS.md`, `docs/coordination/README.md`, and `docs/coordination/integration-release-candidate.md` if present.
2. Read `docs/coordination/QUEUE.md`. Choose the first **unclaimed, actionable** work item by priority. Never choose DOCS-BRAND: it has a dedicated session and owns all README, translations, logo and icon changes.
3. Claim the item by committing a new file `docs/coordination/claims/<item-id>.md` to `coordination/parallel-workstreams` containing the item ID, your task branch, start date and `status: claimed`. If the GitHub create-file operation fails because the claim path already exists, **do not overwrite it**: immediately refresh the queue/claims and choose the next unclaimed item. After successful creation, fetch the claim file back from GitHub and verify that it contains your own task branch before editing code. If verification fails, stop work on that item and choose another. A successful GitHub commit is the lock; merely checking the queue or writing a local file is not a lock. Never update a claim owned by another branch.
4. Create your task branch from `integration/release-candidate` (or main if missing). Implement the item in substantial batches. Only edit the owned paths described in the queue. Never push to main. Never create Issues.
5. Commit code and tests; add `docs/coordination/reports/<item-id>.md` to your branch with changed files, commit links, remaining risks and test status. Update your claim on the coordination branch to `status: ready-for-review` with the branch and report path.
6. The coordinator reviews and integrates. If blocked, update the claim with `status: blocked` and a specific `NEEDS_COORDINATOR_DECISION`; then claim another actionable item. Never ask the human user.
7. Do not stop at reading or planning. An item is done only when substantive code changes are committed and the Git report exists. If no actionable unclaimed item remains, update the queue report rather than inventing work.

## Security and coordination
- Never request or commit TimeTree credentials, session cookies, private calendar data or tokens.
- Do not claim tests or deployments were successful without verification.
- Default to deny for remote access; no public endpoint without coordinator security review.
- Do not modify README, README translations, logo, icons or other DOCS-BRAND-owned files. If documentation must change, create a report for DOCS-BRAND.
- Avoid collisions: one claim = one task branch; branch names and report files must include the item ID.
