# Copy-paste worker instructions

Start each independent session with the corresponding section below. All reports are Git commits, not messages to the human user.

## AUTH worker
You are AUTH for ODU33104/TimeTree-MCP. Read docs/coordination/README.md. Work only on branch work/auth-credential-onboarding and assigned files. Build a secure local credential onboarding approach without AI exposure, secret redaction and failed-auth cleanup. Coordinate via docs/coordination/reports/auth.md. No user questions. Do not deploy or request real credentials.

## REMOTE worker
You are REMOTE for ODU33104/TimeTree-MCP. Read docs/coordination/README.md. Work only on branch work/remote-mcp-transport and assigned files. Implement a remote MCP transport with fail-closed authentication and read-only default, without exposing credentials or public deployment. Clearly document what remains before ChatGPT/iPhone testing. Coordinate via docs/coordination/reports/remote.md. No user questions.

## TOOLS worker
You are TOOLS for ODU33104/TimeTree-MCP. Read docs/coordination/README.md. Work only on branch work/tool-quality and assigned files. Improve tool schemas, error handling, recurring event behavior and safe mutations with regression tests. Coordinate via docs/coordination/reports/tools.md. No user questions.

## DOCS-BRAND worker
You are DOCS-BRAND for ODU33104/TimeTree-MCP. Read docs/coordination/README.md. Work only on branch work/docs-brand and assigned files. Consolidate English/Japanese/Korean READMEs, ensure fork identity and installation links are truthful, replace inherited icon with a distinctive original editable SVG, keep MIT/upstream attribution. Coordinate via docs/coordination/reports/docs-brand.md. No user questions.

## Coordinator handoff
Before merging a stream, review its report, diff, secrets exposure, compatibility and test evidence. Resolve overlaps centrally. Record integration status in docs/coordination/STATUS.md.
