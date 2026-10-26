# Local credential storage (unofficial fork)

The local vault in `src/credentials/local-vault.ts` stores a TimeTree session secret in `~/.config/timetree-mcp/credentials.json` (or an explicit path) with POSIX mode 0600; the directory is mode 0700. Do not put the session value into AI prompts, MCP tool inputs, Git, screenshots, or logs. The vault is **not yet wired to the server authentication path** and is not a complete onboarding flow.

Use a trusted local application to collect the credential outside ChatGPT, then call `saveCredential({ session, createdAt, expiresAt? })`. `loadCredential` rejects insecure POSIX permissions and expired credentials. Rotate by replacing the stored value and restarting the server; revoke old sessions at the provider when supported. File deletion does not revoke a remote session. Avoid backups or sync services that upload this plaintext file. No public remote endpoint is authorized by this work.

This is an unofficial fork and is not affiliated with TimeTree.
