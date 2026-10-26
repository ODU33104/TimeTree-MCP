# Mutation confirmation safety contract

This module creates an **offline, preview-only** plan. It never writes to TimeTree. Every plan is bound to a SHA-256 digest of the action list, a cryptographically random 256-bit confirmation token and an expiry (default five minutes, maximum fifteen). The consumer must display the entire action diff and obtain explicit human approval before calling verifyConfirmation.

**Important:** verifyConfirmation is a pure predicate, not an authorization service. It does not enforce token single-use, user identity, session binding, replay protection or concurrency. The coordinator must implement authenticated server-side single-use token storage, bind each token to the user/calendar, and re-check permissions, latest event versions and expiry immediately before any future write. Do not expose tokens in logs, LLM prompts or MCP outputs.

No remote mutation should be wired until those controls pass security review. Mutations are non-atomic; on partial failure, summarizePartialFailure identifies completed, failed and pending actions for manual recovery. Do not automatically reverse completed operations. No credentials are required for these offline fixtures.

Local verification after dependency installation: `npm run build`, `npm run typecheck` (if provided), and `node --test tests/mutation-gate.test.mjs`. Do not run GitHub Actions during development.
