# Local credential onboarding (not an MCP tool)

Run `onboardLocalCredential()` only from a trusted interactive local terminal. Input is not echoed and is never passed as a tool argument. Storage defaults to `$XDG_CONFIG_HOME/timetree-mcp/credentials.json` or `~/.config/timetree-mcp/credentials.json`. Directory permissions are 0700; file permissions are 0600. The credential is **not encrypted at rest**: protect the host account and backups.

Integration is intentionally pending coordinator approval. Do not expose onboarding through the remote transport, tool schemas, logs, or chat prompts. A server consumer must load the credential locally with `loadCredential()`, handle expiry/revocation, and never serialize its value into MCP responses. To rotate, rerun local onboarding; to revoke, invalidate the credential at its issuer and delete the local file. No live credential or remote authentication flow was tested.
