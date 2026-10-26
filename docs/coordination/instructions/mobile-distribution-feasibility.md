# MOBILE-DISTRIBUTION-FEASIBILITY — research and prototype dispatch

Priority: P0 product-distribution gate, 2026-10-26.
Goal: establish a VERIFIED path for a smartphone-only user to access TimeTree MCP through ChatGPT. Do not assume that mobile ChatGPT permits adding arbitrary custom MCP URLs or that any specific plan supports this. Check current official OpenAI documentation, plan/region/account restrictions, and supported publishing/distribution models. Distinguish ChatGPT app/plugins/connectors/developer mode and supported read vs write operations. Record source URLs and access dates.

## Assignment (one research session)
1. Make a capability matrix for iOS, Android, and Web; distinguish use of an existing published app from adding a private custom remote MCP; record plan, developer mode, publication/review requirements and user onboarding steps. Unknown = unknown, never infer.
2. Investigate viable distribution paths: (a) private self-hosted remote MCP, (b) public ChatGPT app/plugin listing, (c) alternatives that retain conversational mobile UX if direct custom MCP is unavailable. Compare cost, UX, security, and maintenance.
3. Review integration/release-candidate/src/remote-server.ts if present on relevant branch and work/remote-onboard-integrate-20261026; identify remote transport, auth, multi-user credential separation, OAuth requirements, HTTPS, hosting, and mobile constraints. No credentials in chat.
4. Propose the smallest secure proof-of-concept and a phone-only first-run journey with explicit validation checkpoints; do not claim it works without real account/device evidence.
5. Separate blockers caused by ChatGPT platform, TimeTree authorization, network/hosting, and project code. Provide go/no-go decision gates and estimated ongoing hosting costs as assumptions, not verified quotes.
6. Write docs/coordination/reports/MOBILE-DISTRIBUTION-FEASIBILITY.md to coordination/parallel-workstreams, commit SHA, report links and unresolved questions.

No source implementation, no README/icon edits, no main merge, no GitHub Actions. Prefer research and static review; avoid deploying services or incurring cost without approval. Security audit is an independent release blocker.
