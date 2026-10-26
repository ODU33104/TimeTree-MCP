# Internationalization roadmap / 多言語対応計画

Research date: 2026-10-26. Scope: unofficial MCP fork, not the official TimeTree app.

## Evidence
- TimeTree 10-year report (2025-03-24): more than 200 countries/regions; largest overseas registered-user markets in order: US, Germany, Taiwan, UK, South Korea, France, Australia. https://timetreeapp.com/intl/ja/newsroom/2025-03-24/timetree-10th-anniversary-infographics
- Official 2025-09-08 release: 67 million worldwide registrations, 31 million Japan. https://timetreeapp.com/intl/ja/newsroom/2025-09-08/timetree-sk-telecom-capital-and-business-alliance
- Official supported app languages (mobile): English, Japanese, Korean, Simplified Chinese, Traditional Chinese, German, French, Portuguese, Spanish, Italian, Malay, Indonesian, Thai. Web language availability is narrower. https://support.timetreeapp.com/hc/en-us/articles/30023901030425-Change-language

## Documentation priority
P0: English, Japanese, Korean (already present); add German (de) and Traditional Chinese (zh-Hant/Taiwan).
P1: French (fr), Spanish (es), Brazilian Portuguese (pt-BR).
P2: Simplified Chinese (zh-Hans), Italian (it), Thai (th), Indonesian (id), Malay (ms), contingent on demand and reviewers.

Do not conflate official TimeTree user counts with demand for this unofficial MCP fork. No country-by-country MCP download or usage data has been verified.

## Internationalization acceptance
- Single canonical feature/installation/security facts, localized into each README.
- Clear fork disclaimer, upstream MIT attribution, credential-handling guidance, and unsupported mobile/remote caveat in every language.
- Verify install commands, links, release availability, terminology, UTF-8, language navigation, and no misleading compatibility claims.
- Review date/time format, timezone, week start, recurring events, DST, and locale-specific holiday terminology in tests. Translation alone does not establish functional locale support.
- Do not promise a release or working remote integration before validation.
