# Local-only Streamable HTTP transport

This is an **unofficial** loopback-only transport, not a hosted ChatGPT connector. It cannot be reached directly from an iPhone or the ChatGPT cloud. Never bind to a public interface, forward ports, or place behind a public proxy without an independently reviewed authentication and network design.

The local vault must contain a JSON string with `email` and `password` fields. Use the local interactive onboarding function (not an MCP tool) to store it. This vault stores plaintext under filesystem permissions; use a trusted host and protect backups.

Set `TIMETREE_REMOTE_BEARER_TOKEN` to a random secret of at least 32 UTF-8 bytes, and optionally `TIMETREE_REMOTE_ALLOWED_ORIGINS` to a comma-separated explicit HTTPS origin allowlist. Start `dist/remote-server.js` after building; the endpoint is `http://127.0.0.1:8787/mcp`. Only authenticated POST requests are accepted. Default is read-only; writes require explicit `TIMETREE_REMOTE_ALLOW_WRITES=true` and must not be enabled before coordinator security review. No live credentials or external deployments are required for tests.

This module is not yet wired into the package bin command. Coordinator must review entrypoint packaging, test transport interoperability and security before claiming client compatibility.
