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

## Batch localization delivery (2026-10-26)
- Added 10 localized **quick-start** READMEs: de, zh-Hant, fr, es, pt-BR, zh-Hans, it, th, id, ms; existing en/ja/ko brings navigation to 13 languages.
- Updated language links in the three original READMEs and linked all 13 from new pages.
- New translations cover project identity, safety, installation, and disclaimers, **not full feature parity** with existing long READMEs. Native-language review, translation completeness, link validation and locale behavior tests remain open.
- Changes remain only on `work/docs-brand`; coordinator to review before integration.

## PR #23 documentation audit (2026-10-27)
- Branch: `work/docs-brand`. Reviewed PR URL: https://github.com/ODU33104/TimeTree-MCP/pull/23 (PR page itself not retrievable in this session); reviewed branch diff against main via GitHub compare and PR review threads (none returned).
- Checked language files: en, ja, ko, de, zh-Hant, fr, es, pt-BR, zh-Hans, it, th, id, ms (13/13).
- PASS: 13 README files present; three detailed (en/ja/ko), ten quick-start only. Added explicit coverage and unverified-feature warnings to all 13.
- PASS: repository path comparison shows changes limited to owned READMEs, icon and docs-brand reports/roadmap; no other implementation files modified.
- PASS: spot-checked relative target paths `docs/MCP_CLIENTS.md`, `DISCLAIMER.md`, `LICENSE`, `TimeTree-MCP-install.sh`, and `docs/assets/demo-en.gif` exist on branch.
- FAIL / needs remediation: ten quick-start pages still contain English technical boilerplate, not fully localized; their feature coverage is shorter than detailed versions. Native-speaker translation and consistency audit outstanding.
- NOT RUN: exhaustive link crawl; all language-specific demo image checks; actual installs/builds, device/client integration, locale/timezone/DST tests; GitHub Actions. External release assets and mobile connectivity not verified.
- NOT VERIFIED: live PR #23 description/mergeability (PR page unavailable via public web fetch); coordinator should check PR metadata and conflicts before merge.
- Coordinator decision: retain separate README ownership and SVG icon; resolve other workstreams' README changes during integration. No main merge, deployment, paid services or Actions initiated.
