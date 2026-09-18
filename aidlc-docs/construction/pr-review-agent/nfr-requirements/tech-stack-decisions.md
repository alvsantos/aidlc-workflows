# Tech Stack Decisions — Unit: pr-test-quality-gate

| Concern | Decision | Rationale |
|---|---|---|
| Gate orchestration | **Bash steps in `ci.yml`** invoking native toolchains | Thin glue; runs each component's own tests; no heavy runtime needed (C-01) |
| `app/` tests + coverage | **pytest + pytest-cov** (`coverage.py`) | Existing app tooling; emits coverage.xml/term |
| `infra/` tests + coverage | **TypeScript test runner with coverage** (e.g., `jest`/`vitest` via `npm test -- --coverage`, or `nyc`) | Native to CDK/TS; if not present, adding it is in scope (C-03) |
| Coverage threshold | **Global min ~80% per component**, configurable via env | Q3=A |
| Stage 2 AI engine | **Kiro CLI (headless)** — `kiro-cli chat --no-interactive`, pinned version, constrained tools | Q3 (infra) = "I want kiro cli" |
| Stage 2 auth | `KIRO_API_KEY` fetched at runtime from **AWS Secrets Manager via OIDC** (no static key in GitHub); masked | keeps OIDC posture; avoids static GitHub key |
| Stage 2 invocation | `subprocess` arg-list `kiro-cli chat --no-interactive` with `timeout`; check exit codes 0/1/2 | injection-safe; fail-closed |
| GitHub API | **built-in `GITHUB_TOKEN`** via `gh` CLI | Ephemeral, per-run; not a stored secret |
| JSON handling | **`jq`** for coverage/adequacy parsing + verdict | Q3(bash-change)=A; standard, pinned |
| Kiro CLI | Used **both** developer-locally (author tests) **and** in-pipeline (Stage 2 engine) | Q3 (infra) decision 2026-09-17 |
| Pure-helper tests | **Example-based** shell tests (assertions/exit codes) for `parse_coverage`, `compute_gate_verdict`, `parse_adequacy_response` | PBT Partial → N/A for thin glue; example-based satisfies PBT-10 |
| Supply chain | Pin actions to SHA/tag; `npm ci`; pinned Python deps; no `latest` | SECURITY-10 |

## Configuration (environment variables)
| Var | Default | Purpose |
|---|---|---|
| `AWS_ROLE_ARN` | (repo var) | OIDC role assumed to read the Kiro secret (Stage 2) |
| `AWS_REGION` | `us-east-1` | Region for Secrets Manager |
| `KIRO_SECRET_ARN` | (repo var) | ARN of the Secrets Manager secret holding `KIRO_API_KEY` |
| `KIRO_API_KEY` | (fetched at runtime) | Kiro CLI auth — injected into Stage 2 step only, masked |
| `KIRO_CLI_VERSION` | pinned | Kiro CLI version installed on the runner |
| `GH_TOKEN` | `GITHUB_TOKEN` | gh CLI auth (ephemeral) |
| `APP_COVERAGE_MIN` | `80` | app coverage threshold |
| `INFRA_COVERAGE_MIN` | `80` | infra coverage threshold |
| `BASE_BRANCH` | `dev` | Branch the gate runs against |
| `STAGE2_TIMEOUT_SECONDS` | `300` | Kiro CLI adequacy timeout, fail-closed |

## PBT Framework (PBT-09, Partial)
No PBT framework is adopted for this gate unit — it is thin CLI orchestration, and PBT is marked **N/A with rationale** (Partial mode). Product-code PBT belongs to the `app`/`infra` units. Pure helpers get example-based tests.

## Rejected / Superseded
- **Amazon Bedrock as Stage 2 engine** (interim design) — superseded 2026-09-17: user chose **Kiro CLI** for Stage 2. IAM grant reverts from `bedrock:InvokeModel` to `secretsmanager:GetSecretValue`.
- **`KIRO_API_KEY` as a plain GitHub secret** — rejected: long-lived key in GitHub; fetched from Secrets Manager via OIDC instead.
- **LLM diff-review of arbitrary code** — replaced by the narrower, post-gate business-rule adequacy check.
