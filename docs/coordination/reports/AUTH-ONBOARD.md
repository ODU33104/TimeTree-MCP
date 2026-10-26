# AUTH-ONBOARD implementation report

- Claim: `AUTH-ONBOARD`; branch: `task/AUTH-ONBOARD`, based on `integration/release-candidate`.
- Code: `src/credentials/local-vault.ts` — atomic local-only file storage, restrictive POSIX file/directory permissions, validation and expiry rejection.
- Tests: `tests/credential-vault.test.mjs` — roundtrip, file mode, malformed and expired entries.
- Documentation: `docs/security-local-credentials.md` — plaintext-at-rest risk, rotation, local-only boundary and non-affiliation.
- Commits: https://github.com/ODU33104/TimeTree-MCP/commit/88d39439f820c27cfab65bfc8ecac0f09981116a ; https://github.com/ODU33104/TimeTree-MCP/commit/3b0f0d645983da0a165b5a4979f3da53391704c5 ; https://github.com/ODU33104/TimeTree-MCP/commit/de5ebc0cb5c2d2e7e6258c918717164443acc6d1
- Test status: NOT RUN. No build, typecheck, integration or live TimeTree test has been executed.
- Remaining gap: vault not connected to server authentication; interactive local secret-entry CLI not yet implemented. Plaintext-at-rest is protected by filesystem permissions, not OS keychain encryption.
- NEEDS_COORDINATOR_DECISION: agree on credential consumer interface and whether a platform keychain is required before exposing onboarding. Do not deploy publicly.
