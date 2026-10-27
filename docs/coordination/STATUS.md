# Integration status

## 2026-10-27 — 新司令塔への引き継ぎ（この項目が現行の要約）

- **最新のGitHub実査と優先順位:** [COORDINATOR-HANDOFF.md](COORDINATOR-HANDOFF.md)。以下の表は**過去2026-10-26時点の歴史的スナップショット**であり、現時点の完了状況として使用しない。
- **担当への1メッセージ指示の出し方:** [ONE-PASTE-DISPATCH.md](ONE-PASTE-DISPATCH.md)。コピーボタン1つの中にGitHub URLと実行内容をまとめる。
- **現在の重要事実:** main 29 tools、integration candidate 32（main未統合）；過去172テストPASSでも依存監査FAIL；PR #20〜#24はreview待ち；13言語READMEのPR #23はwork/docs-brand向け；DEP-AUDIT-REMEDIATE claim blocked；新規Actions起動/本番公開/mainマージなし。詳細は引継ぎ書と最新claimsを参照。


Updated: 2026-10-26. Coordinator reviewed all four worker branch diffs and Git reports.

| Stream | Branch | Commits ahead of main | Actual deliverable | QA status |
| --- | --- | ---: | --- | --- |
| AUTH | `work/auth-credential-onboarding` | 3 | Sanitized auth/network error logging, redirect rejection | Not tested; no out-of-chat onboarding yet |
| REMOTE | `work/remote-mcp-transport` | 3 | `src/remote/security.ts` bearer/Origin/size policy and deployment doc | Not tested; HTTP MCP transport not built |
| TOOLS | `work/tool-quality` | 4 | Safer calendar IDs and recurring timestamps | Not tested; compatibility assumptions pending |
| DOCS-BRAND | `work/docs-brand` | 5 | English/Japanese/Korean README and original connector/pulse SVG icon | Not tested; fork release links need validation |
| COORDINATOR | `coordination/parallel-workstreams` | 7+ | Instructions, ownership and report convention | Integration pending |

## Integration blockers
1. AUTH and earlier `fix/http-credential-boundary` overlap; reconcile before merge. Secure credential onboarding is still absent.
2. REMOTE currently contains only security helpers; it cannot be advertised as a working ChatGPT/iPhone remote connector.
3. TOOLS identifier validation may reject valid IDs; verify against known API fixtures.
4. DOCS-BRAND fork release/install links must not imply a published artifact. Existing demo GIF provenance requires review.
5. CI/build/unit/integration tests have not been executed for these worker branches.

## Next coordinator actions
- Review and combine overlapping code without losing security fixes.
- Integrate complete and safe independent changes into a single release candidate branch.
- Verify build, typecheck, unit tests and privacy/security tests together, then isolated live read-only testing.
- Keep `main` untouched until the QA gate passes. No GitHub Issues or user-facing progress questions.

## 2026-10-26 — GitHub Actions budget policy and integration handoff
- GitHub Actions: **minimize billable runs**. No push-triggered or per-PR heavy CI while iterating; prefer local `npm ci`, typecheck, build and tests. Reserve manual `workflow_dispatch` or a release gate for final integration/security milestones. Do not disable mandatory security protections without review.
- Worker feature branches for PR #7–#19 have been submitted; **do not interpret draft PR creation as integration or passing QA**.
- User reports integration worker has finished, but coordinator has **not yet verified an integration commit, successful local tests, or report**. Treat status as unverified until exact SHA and output are confirmed.
- Coordinator must inspect worker integration result before any merge to `main`; README/icon changes remain with docs-brand worker.
