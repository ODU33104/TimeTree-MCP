# Security QA regression gate

These deterministic tests use fake credentials and mocked HTTP; no live TimeTree account is needed.

Run `npm run test:build` followed by `node --test tests/*security.test.mjs`. The existing `npm test` script also discovers the new tests via `tests/*.test.mjs`.

Coverage: remote bearer authentication and hostile Origin rejection; remote configuration default-deny; bounded request sizes; HTTP origin enforcement; redacted error bodies; redirect rejection; read-only allowlist and unknown-tool denial.

**Not executed in this task branch.** The integration candidate's HTTP client currently extracts TimeTree numeric error codes but drops the parsed code when throwing `HttpError`; this may break session refresh logic. Coordinator should repair this on an owned source branch and add a code-preservation test. No public deployment is approved.
