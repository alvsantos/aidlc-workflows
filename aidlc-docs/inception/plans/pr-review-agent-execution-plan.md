# Execution Plan — PR Test-Quality Gate

> **Scope pivot (2026-09-17)**: from "LLM diff-reviewer" to a **two-stage test-quality gate** extending `ci.yml`. Stage 2 engine = **Kiro CLI headless** (also used developer-locally), with `KIRO_API_KEY` fetched from **Secrets Manager via OIDC** (no static GitHub key). A brief interim Bedrock design is superseded. Prior designs kept as backups + change history.

## Detailed Analysis Summary

### Transformation Scope (Brownfield)
- **Transformation Type**: Feature addition by **extending `ci.yml`** — not architectural.
- **Primary Changes**:
  1. Extend `.github/workflows/ci.yml` with a `quality-gate` job (Stage 1 + Stage 2)
  2. Add `.github/scripts/pr-gate/` (bash + jq): run per-component tests, parse coverage, compute verdict, run **Kiro CLI** adequacy, report to PR
  3. Ensure each component emits coverage (`app`: pytest-cov present; `infra`: add TS coverage command if missing)
  4. Minimal IAM: scoped `secretsmanager:GetSecretValue` grant on the existing OIDC role (for the Kiro key)
- **Related Components**: existing `ci.yml`, CodeBuild runner, existing OIDC role, Secrets Manager (Kiro key), `app/` + `infra/` test tooling

### Change Impact Assessment
- **User-facing changes**: No (developer-tooling / CI)
- **Structural changes**: No
- **Data model changes**: No
- **API changes**: No (consumes GitHub API + Kiro CLI + Secrets Manager; exposes none)
- **NFR impact**: Yes — Security (Kiro CLI via Secrets-Manager-over-OIDC, scoped GetSecretValue, constrained tools, fail-closed, injection-safe), cost/latency (AI only after Stage 1), observability

### Component Relationships (Brownfield)
- **Primary Component**: `pr-test-quality-gate` (new gate logic in `.github/`)
- **Modified**: `ci.yml` (extended); `infra/` test config (add coverage); `PipelineStack` (add GetSecretValue statement)
- **Infrastructure**: scoped `secretsmanager:GetSecretValue` on the existing OIDC role + Kiro key secret
- **Supporting**: CodeBuild runner, `app`/`infra` toolchains, Kiro CLI (pinned)

### Risk Assessment
- **Risk Level**: **Low-to-Medium** — isolated to PR CI; Stage 2 adds an AI call (scoped, fail-closed, cost-bounded).
- **Rollback Complexity**: Easy (revert the `ci.yml` job + scripts; remove the IAM statement).
- **Testing Complexity**: Moderate (example-based tests for pure bash/jq helpers; integration/dry-run for stages).

## Workflow Visualization (text)
```
INCEPTION: Workspace Detection ✓ | Requirements ✓ (rewritten) | Workflow Planning ✓ (this doc)
           User Stories SKIP | Application Design SKIP | Units Generation SKIP
CONSTRUCTION (unit: pr-test-quality-gate):
  Functional Design ✓ (rewritten) → NFR Requirements ✓ (rewritten) → NFR Design ✓ (rewritten)
  → Infrastructure Design EXECUTE → Code Generation EXECUTE → Build and Test EXECUTE
OPERATIONS: PLACEHOLDER
```

## Phases to Execute

### 🔵 INCEPTION PHASE
- [x] Workspace Detection (COMPLETED)
- [x] Reverse Engineering (SKIPPED)
- [x] Requirements Analysis (COMPLETED — rewritten for the pivot)
- [ ] User Stories — **SKIP** (single actor; CI tooling)
- [x] Workflow Planning (COMPLETED — this document, revised)
- [ ] Application Design — **SKIP** (single gate unit; handled in Functional Design)
- [ ] Units Generation — **SKIP** (single unit; two component-lanes within it)

### 🟢 CONSTRUCTION PHASE (Unit: `pr-test-quality-gate`)
- [x] Functional Design — COMPLETED (rewritten: two-stage gate)
- [x] NFR Requirements — COMPLETED (rewritten: Kiro CLI Stage 2 via Secrets-Manager-over-OIDC, PBT Partial)
- [x] NFR Design — COMPLETED (rewritten: patterns + logical components)
- [ ] Infrastructure Design — **EXECUTE**
  - **Rationale**: Scoped `secretsmanager:GetSecretValue` grant on the OIDC role (for the Kiro key); ci.yml job wiring; coverage tooling for infra; branch-protection required check.
- [ ] Code Generation — **EXECUTE (ALWAYS)**
  - **Rationale**: Implement the ci.yml `quality-gate` job + `.github/scripts/pr-gate/` bash/jq + example-based tests.
- [ ] Build and Test — **EXECUTE (ALWAYS)**
  - **Rationale**: Instructions to run gate scripts + example tests; verify existing ci.yml unaffected; `cdk synth` still passes.

### 🟡 OPERATIONS PHASE
- [ ] Operations — PLACEHOLDER

## Component / Change Sequence
1. Pure bash/jq helpers (parse_coverage, stage1_verdict, parse_adequacy, compute_verdict) + example tests — Critical
2. Stage 1 runner (app pytest-cov, infra TS coverage) — Critical
3. Stage 2 runner (OIDC → Secrets Manager → Kiro CLI adequacy) + IAM `secretsmanager:GetSecretValue` grant + Kiro key secret — Important
4. `ci.yml` `quality-gate` job wiring + report.sh — Critical
5. Repo config: branch-protection required check + model/threshold repo variables — Important (documented)

## Success Criteria
- **Primary Goal**: On PRs to `dev`, `ci.yml` runs per-component tests + coverage (Stage 1, blocking) and, on pass, an AI business-rule adequacy check (Stage 2, **Kiro CLI headless**; key via Secrets-Manager-over-OIDC); the required status check blocks merge unless both pass.
- **Key Deliverables**:
  - Extended `.github/workflows/ci.yml` (`quality-gate` job)
  - `.github/scripts/pr-gate/` bash + jq scripts + example-based tests
  - `infra/` coverage command (if missing)
  - Scoped `secretsmanager:GetSecretValue` IAM grant added to `PipelineStack` + Kiro key secret (bootstrap)
  - Documented repo config: required status check + `KIRO_SECRET_ARN`/`KIRO_CLI_VERSION`/threshold variables
- **Quality Gates**:
  - Security Baseline compliance (blocking): Kiro CLI via Secrets-Manager-over-OIDC (no static GitHub key), scoped GetSecretValue, constrained CLI tools, fail-closed, injection-safe
  - PBT (Partial): N/A-with-rationale for glue; example-based tests for pure helpers
  - Existing `ci.yml` behavior preserved; `cdk synth` still passes
- **Integration Testing**: Gate correctly passes/blocks against sample PRs (passing suite ≥ threshold → PASS; failing/low-coverage → FAIL_STAGE1; inadequate tests → FAIL_STAGE2; engine error → ERROR/fail-closed).
