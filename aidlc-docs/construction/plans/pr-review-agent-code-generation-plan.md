# Code Generation Plan — Unit: pr-test-quality-gate

**Single source of truth for Code Generation.** Brownfield: modify existing files in place; create new ones only where noted. All application code at workspace root (never in `aidlc-docs/`).

## Unit Context
- **Goal**: Extend `ci.yml` (PRs to `dev`) with a two-stage test-quality gate: Stage 1 (deterministic per-component tests + coverage), Stage 2 (Kiro CLI business-rule adequacy, only on Stage 1 pass).
- **Engine/auth**: Kiro CLI headless; `KIRO_API_KEY` from Secrets Manager via existing OIDC role. GitHub via ephemeral `GITHUB_TOKEN` + `gh`.
- **Dependencies**: existing `ci.yml`, `PipelineStack` (add scoped `GetSecretValue`), `app/` (pytest-cov), `infra/` (add TS coverage command).
- **Extensions**: Security Baseline (blocking); PBT Partial (N/A for glue → example-based shell tests for pure helpers).

## Target Paths (workspace root)
```
.github/workflows/ci.yml                       # MODIFY: add quality-gate job
.github/scripts/pr-gate/
  ├── run_stage1.sh        (CREATE)  run app+infra tests, collect coverage
  ├── parse_coverage.sh    (CREATE)  PURE: extract coverage % (jq/xmllint)
  ├── stage1_verdict.sh    (CREATE)  PURE: aggregate per-component results
  ├── run_stage2.sh        (CREATE)  OIDC->Secrets Manager->kiro-cli adequacy
  ├── parse_adequacy.sh    (CREATE)  PURE: parse Kiro CLI JSON -> verdict/rationale
  ├── compute_verdict.sh   (CREATE)  PURE: BR-GATE-09 precedence
  ├── report.sh            (CREATE)  I/O: upsert PR comment + set status (gh)
  ├── prompt.tmpl          (CREATE)  injection-safe Stage 2 prompt template
  └── tests/               (CREATE)  example-based shell tests for PURE helpers
infra/stacks/pipeline-stack.ts                 # MODIFY: add scoped GetSecretValue statement
infra/package.json                             # MODIFY: add coverage-capable test script
```

---

## Generation Steps

- [x] **Step 1 — Pure helper: `parse_coverage.sh`**  (BR-GATE-05) Extract line-coverage % from pytest coverage.xml and infra coverage summary; deterministic; no I/O.
- [x] **Step 2 — Pure helper: `stage1_verdict.sh`**  (BR-GATE-04/05/06) Aggregate per-component (tests_passed AND meets_threshold) → PASS / FAIL_STAGE1.
- [x] **Step 3 — Pure helper: `parse_adequacy.sh`**  (BR-GATE-08) Parse Kiro CLI JSON (`verdict`,`rationale`) via jq; malformed → ERROR (never crash).
- [x] **Step 4 — Pure helper: `compute_verdict.sh`**  (BR-GATE-09) Precedence ERROR > FAIL_STAGE1 > FAIL_STAGE2 > PASS.
- [x] **Step 5 — Example-based tests for Steps 1–4**  (PBT-10 / Partial) `tests/*.sh` — 18 assertions, all pass.
- [x] **Step 6 — Stage 1 runner: `run_stage1.sh`**  (BR-GATE-03/04) Run `pytest --cov` (app) and `npm test -- --coverage` (infra); call parse_coverage + stage1_verdict; fail-closed on runner error.
- [x] **Step 7 — Stage 2 prompt template: `prompt.tmpl`**  (BR-GATE-14) Injection-safe, delimited untrusted content; requests strict JSON output.
- [x] **Step 8 — Stage 2 runner: `run_stage2.sh`**  (BR-GATE-07/08/13) OIDC creds; `aws secretsmanager get-secret-value` → mask → `kiro-cli chat --no-interactive` (constrained tools, timeout); call parse_adequacy; fail-closed.
- [x] **Step 9 — Reporter: `report.sh`**  (BR-GATE-10/11/14-idempotent) Upsert marker comment + set required status via `gh`; no secrets in output.
- [x] **Step 10 — Extend `ci.yml`**  (FR-01/02/06/09) Added `quality-gate` job on PR to `dev`; existing jobs preserved. YAML validated.
- [x] **Step 11 — `infra/` coverage command**  (Q4=A, C-03) Added `test` script (jest --coverage) + jest config + minimal test; coverage summary produced.
- [x] **Step 12 — IAM grant in `pipeline-stack.ts`**  (Infra Design) Added scoped `secretsmanager:GetSecretValue` to `GitHubActionsDeployRole` inline policy; verified via cdk synth + jest test.
- [x] **Step 13 — Docs**  Created code-summary.md + README bootstrap section (secret, repo variables, branch protection, rotation).
- [x] **Step 14 — Consistency pass**  YAML valid (jobs: test/quality-gate/deploy-dev); no duplicate files; secret masked; helper tests 18/18; infra tests 3/3; tsc clean.

## Story / Requirement Traceability
- FR-01/02 → Steps 10
- FR-03/04 (Stage 1) → Steps 1,2,6,11
- FR-05 (Stage 2) → Steps 3,7,8
- FR-06/07 (status + report) → Steps 4,9,10
- NFR-01 security (Kiro via Secrets Manager, fail-closed, injection-safe) → Steps 8,7,12,6/9
- PBT Partial (example-based) → Step 5

## Scope
14 steps. Bash + jq scripts, one `ci.yml` job, one CDK IAM statement, infra coverage config, docs. Tests authored here; executed in Build & Test.
