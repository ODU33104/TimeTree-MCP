# DOCS-BRAND report

Date: 2026-10-26
Branch: `work/docs-brand`
State: implementation committed; coordinator review required

## Completed
- Updated English, Japanese and Korean README with matching fork attribution, explicit unofficial status, credential safety and unverified mobile/remote support.
- Repointed installation clone/script, release and CI links to fork (release publication remains unverified).
- Preserved upstream contributor credit and MIT attribution.
- Replaced inherited calendar icon with original abstract connector/pulse SVG.

## Commits
- [English README](https://github.com/ODU33104/TimeTree-MCP/commit/cc78044f30ef7c5543df1f9379da977c3ea05635)
- [Japanese README](https://github.com/ODU33104/TimeTree-MCP/commit/c29403aa6d67ed6d3d6478503fe43faf6ef6d417)
- [Korean README](https://github.com/ODU33104/TimeTree-MCP/commit/4585b30887c22344b43a0debb97d369ce6ce80eb)

## Risks / coordinator decisions
- NEEDS_COORDINATOR_DECISION: Verify fork release artifacts, CI workflow, installer path and installation commands before merging or publishing.
- NEEDS_COORDINATOR_DECISION: Integrate README changes from PR #1 without losing upstream attribution.
- Existing demo GIFs were not modified; verify their provenance and whether screenshots accurately reflect the fork.
- No build, integration, device, or live account tests executed. No claims of compatibility or successful releases.
- Fork's current credentials configuration is local-client based; new credential onboarding is owned by AUTH. Coordinate documentation after AUTH implementation.
- Docs-brand changes are not merged into main.

## Internationalization follow-up
- Researched official worldwide usage, markets and supported languages; roadmap committed at `docs/INTERNATIONALIZATION.md`.
- Proposed next docs languages: German and Traditional Chinese first, then French, Spanish and Brazilian Portuguese.
- Coordinator: decide translation review ownership and locale-specific date/time tests before merging.

## Brand icon revision
- Replaced abstract pulse icon with an original white-background mint four-petal connector mark, three nodes and curved link; `docs/assets/icon.svg` commit `d7fcd49`.
- Artwork is a distinct project identity, not an official TimeTree icon; visually review small-size rendering and potential trademark confusion before publication.
