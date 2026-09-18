# NFR Requirements — Unit: pr-test-quality-gate

## Security (SECURITY extension — ENABLED, blocking)

| Rule | Applicability | Requirement for this unit |
|---|---|---|
| SECURITY-03 (App logging) | Applicable | Never log OIDC/AWS creds, `KIRO_API_KEY`, or `GITHUB_TOKEN`; coverage reports/diffs at DEBUG only. |
| SECURITY-05 (Input validation) | Applicable | PR content, test files, coverage output, and Kiro CLI output are untrusted; parse defensively (safe JSON via jq); subprocess arg-lists (no shell interpolation); Kiro CLI run with constrained tools (no `--trust-all-tools`). |
| SECURITY-06 (Least privilege) | Applicable | OIDC role gets scoped `secretsmanager:GetSecretValue` on the Kiro-key secret ARN — no wildcards. `GITHUB_TOKEN` scoped to PR read + comment write + checks/statuses write. |
| SECURITY-10 (Supply chain) | Applicable | Pin actions to SHA/tag; `npm ci`; pinned Python deps; pinned `jq`; pinned `kiro-cli` version; no `latest`. |
| SECURITY-11 (Secure design) | Applicable | Stage 2 prompt-injection defense (delimited untrusted content) + constrained CLI tools; two-stage separation keeps deterministic gate independent of the AI stage. |
| SECURITY-12 (AuthN/credential mgmt) | Applicable | **No static AI key in GitHub.** `KIRO_API_KEY` stored in AWS Secrets Manager, fetched at runtime via OIDC (short-lived STS), masked. GitHub via ephemeral built-in token. |
| SECURITY-13 (Integrity) | Applicable | Pinned toolchains + pinned Kiro CLI; safe parsing of coverage/AI output (no eval/deserialization of untrusted objects). |
| SECURITY-15 (Fail-safe) | Applicable | Any test-runner/coverage/Secrets-Manager/Kiro-CLI error, non-zero exit, or timeout → gate verdict ERROR → failing check (fail closed). |
| SECURITY-01 (Encryption) | Applicable (minimal) | Kiro key stored in Secrets Manager (KMS at rest; TLS in transit). No other data store. |
| SECURITY-02 (Network intermediary logging) | N/A | No LB/API-gateway/CDN. |
| SECURITY-04 (HTTP headers) | N/A | No HTML endpoint. |
| SECURITY-07 (Network config) | N/A | Runs on existing CodeBuild runner; no new network resources. |
| SECURITY-08 (App access control) | N/A | No application endpoints. |
| SECURITY-09 (Hardening) | Partial | No default creds; PR-facing errors are generic (no stack traces leaked). |
| SECURITY-14 (Alerting/monitoring) | Partial | Gate status visible in GitHub Actions UI + PR checks; Secrets Manager access audited via CloudTrail. Formal alerting out of scope (documented). |

## Property-Based Testing (extension — PARTIAL)
- Partial enforces PBT-02/03/07/08/09 **where applicable**.
- **This gate unit**: PBT marked **N/A with rationale** — it orchestrates the components' existing tests and adds only thin CLI glue + coverage/verdict parsing. No PBT framework adopted (PBT-09 N/A for glue).
- **Required instead**: example-based tests for pure helpers (`parse_coverage`, `compute_gate_verdict`, `parse_adequacy_response`) — PBT-10 complementary-testing intent.
- Product-code PBT remains the responsibility of the `app`/`infra` units, not this gate.

## Performance & Cost
- **PERF-01**: Stage 2 (paid AI) runs ONLY after Stage 1 passes.
- **PERF-02**: Stage 2 input bounded (changed test files + relevant business-rule context, not whole repo); `STAGE2_TIMEOUT_SECONDS` (default 300) enforced on the Kiro CLI call, fail-closed.
- **PERF-03**: Stage 1 reuses fast native test runners already used by `ci.yml`.

## Reliability
- **REL-01**: Fail-closed on any error (BR-GATE-12).
- **REL-02**: Deterministic Stage 1 (same inputs → same verdict).
- **REL-03**: Idempotent PR summary comment (marker-based upsert; no duplicates on re-run).

## Observability
- **OBS-01**: Structured summary: per-component pass/fail + coverage %, and Stage 2 verdict + rationale (no secrets).
- **OBS-02**: Status check description conveys the verdict succinctly.

## Maintainability
- **MNT-01**: Pure helpers isolated from I/O for example-based testing.
- **MNT-02**: Thresholds/model/region via env vars (tech-stack-decisions.md) — no hardcoding.
- **MNT-03**: Extends `ci.yml` without breaking existing steps (regression-guarded).

## Resiliency (extension DISABLED)
N/A per Q8=B; fail-safe via SECURITY-15/REL-01.

---

## Compliance Summary (this stage)
- **Security Baseline**: Compliant — Stage 2 = Kiro CLI with `KIRO_API_KEY` via Secrets-Manager-over-OIDC (no static GitHub key, SECURITY-12), scoped `secretsmanager:GetSecretValue` (SECURITY-06), constrained CLI tools + injection-safe (SECURITY-05/11), fail-closed (SECURITY-15).
- **PBT (Partial)**: Compliant — PBT N/A-with-rationale for the gate; example-based tests required for pure helpers (PBT-09/10 addressed).
- **Resiliency**: N/A (disabled).
