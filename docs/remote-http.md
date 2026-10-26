# Local remote MCP endpoint (experimental)

Unofficial TimeTree fork; not affiliated with TimeTree, Inc. This entry point is **not a verified iPhone ChatGPT integration**.

Build with `npm run build` after integrating `src/remote-server.ts` into the bundler's entry list. Run the built remote entry with local `TIMETREE_EMAIL`, `TIMETREE_PASSWORD`, and a separately generated random `TIMETREE_REMOTE_BEARER_TOKEN` (at least 32 bytes). Optional: `TIMETREE_REMOTE_ALLOWED_ORIGINS`, `TIMETREE_REMOTE_PORT` (default 8787).

The listener refuses non-loopback host bindings and requires bearer authentication for every request. Only POST /mcp is enabled, and the server is stateless: each request receives a new SDK transport. Mutating tools are excluded unless `TIMETREE_REMOTE_ALLOW_WRITES=true`. Body size and request time are bounded.

**Do not expose this server publicly** or place it behind a tunnel without an independent security review. This is single-tenant; no identity-bound credential store, OAuth, external TLS, or real device compatibility verification is provided. No test execution has been performed for this work item.
