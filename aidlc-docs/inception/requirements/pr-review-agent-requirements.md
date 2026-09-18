# Requirements — PR Test-Quality Gate

> **Scope history**: This feature began as an "autonomous PR review agent" (LLM diff-reviewer). On 2026-09-17 the user reframed it: the pipeline runs the **already-generated per-component tests**, checks **coverage**, and validates **test adequacy against business rules** (two-stage gate). The Stage 2 adequacy engine is the **Kiro CLI headless** (decision 2026-09-17), authenticated via `KIRO_API_KEY` fetched from **AWS Secrets Manager via OIDC** (no static key in GitHub). A brief interim design used Amazon Bedrock; it is superseded. Kiro CLI is used both developer-locally and in the Stage 2 pipeline step.

## Intent Analysis
- **User Request (original)**: "extend my CICD pipeline ... an autonomous agent responsible for reviewing my pull requests to main."
- **User Request (refined)**: The pipeline runs the components' existing tests, checks coverage, and checks that the tests validate what the business rules define. Kiro CLI is developer-local.
- **Request Type**: Enhancement (extend existing `ci.yml`)
- **Scope Estimate**: Multiple components — extend one workflow; add two gate stages covering `app/` (pytest) and `infra/` (TS/CDK)
- **Complexity Estimate**: Moderate — per-component test/coverage orchestration (deterministic) + a scoped AI business-rule-adequacy check
- **Project Type**: Brownfield

## The Two-Stage Gate (core concept — Q1=X)
1. **Stage 1 — Deterministic Coverage Gate**: run each component's existing tests in its own toolchain and enforce a global minimum coverage per component. Fails the gate on any test failure or coverage below threshold. No AI.
2. **Stage 2 — AI Business-Rule Adequacy Check** (runs ONLY if Stage 1 passes): an LLM judges whether the **new/changed tests** meaningfully validate the **business rules** relevant to the change. Produces a pass/fail (+ rationale) that contributes to the gate.

---

## Functional Requirements

### FR-01: Trigger on PRs to `dev`
The gate MUST run on pull requests targeting `dev` (opened/reopened/synchronize), as part of the existing CI. *(Q2=A)*

### FR-02: Extend existing `ci.yml`
The gate MUST be implemented by **extending `.github/workflows/ci.yml`** (not a separate workflow). It runs on the existing CodeBuild self-hosted runner. *(Q5=B)*

### FR-03: Per-component test execution
The gate MUST run each component's already-generated tests in its own toolchain: *(Q4=A)*
- **`app/`**: `pytest` (with coverage via `coverage.py`/`pytest-cov`)
- **`infra/`**: the TypeScript/CDK test command (e.g., `npm test` with coverage)

### FR-04: Stage 1 — Deterministic coverage gate
For each component, the gate MUST:
- Run the tests; FAIL if any test fails
- Measure line coverage; FAIL if coverage < the configured global minimum (default ~80%, per component) *(Q3=A)*

### FR-05: Stage 2 — AI business-rule adequacy (post-gate)
Only if Stage 1 passes, the gate MUST run an AI check that assesses whether the new/changed tests validate the business rules affected by the PR, emitting a **pass/fail + rationale**. The Stage 2 engine is the **Kiro CLI in headless mode** (`kiro-cli chat --no-interactive`), invoked in the pipeline. *(Q1=X two-stage; Stage 2 engine = Kiro CLI per decision 2026-09-17.)*

### FR-06: Blocking status check
The gate MUST publish a required status check on the PR head commit that **fails** (blocks merge) if Stage 1 fails OR Stage 2 fails; it **passes** only when both stages pass. *(Q2=A, FR-06 carried over)*

### FR-07: Report results to the PR
The gate MUST surface results on the PR: per-component test outcome + coverage numbers (Stage 1) and the adequacy verdict + rationale (Stage 2), as a concise summary comment and/or the status check description.

### FR-08: Kiro CLI usage
Kiro CLI is used **both** by the developer locally (to author tests) **and** in the pipeline as the **Stage 2 review engine** (`kiro-cli chat --no-interactive`). *(Revised 2026-09-17: user chose Kiro CLI for Stage 2 over Bedrock.)*

### FR-09: Coexistence / no regression
Extending `ci.yml` MUST preserve its existing behavior (lint, unit tests, `cdk synth`, deploy-dev on pass). The gate augments, not replaces, those steps.

---

## Non-Functional Requirements

### NFR-01: Security (Extension: ENABLED — blocking)
- **AuthN (SECURITY-12)**: The Stage 2 engine is the **Kiro CLI (headless)**, authenticated with `KIRO_API_KEY`. The key is **NOT** a GitHub secret — it is stored in **AWS Secrets Manager** and fetched at runtime via the existing **OIDC role** (short-lived STS), then masked and injected only into the Stage 2 step. GitHub API calls use the built-in ephemeral `GITHUB_TOKEN`.
- **Least privilege (SECURITY-06)**: The OIDC role gets a scoped `secretsmanager:GetSecretValue` grant on the specific Kiro-key secret ARN only — no wildcards. GitHub token scoped to PR read + checks/statuses write + comment write. The Kiro CLI is run WITHOUT `--trust-all-tools` (constrained tool posture) since it processes untrusted PR/test content.
- **No secrets/PII in logs (SECURITY-03)**: No credentials logged; coverage reports and diffs logged only at DEBUG.
- **Untrusted input / prompt-injection (SECURITY-05/11)**: PR content and test files are untrusted; the Stage 2 prompt MUST delimit them and ignore embedded instructions.
- **Supply chain (SECURITY-10)**: All actions pinned; toolchains use lock files (`npm ci`, pinned Python deps); no `latest`.
- **Fail-safe (SECURITY-15)**: On infrastructure error in Stage 1 (test runner crash) → gate fails closed. On Stage 2 error (Secrets Manager fetch failure, Kiro CLI non-zero exit [1/2], timeout, malformed output) → **fail closed by default** (blocks), rationale surfaced.

### NFR-02: Property-Based Testing (Extension: ENABLED — PARTIAL)
Downgraded Full→Partial (2026-09-17). Partial enforces PBT-02/03/07/08/09 where applicable. **For this gate unit, PBT is largely N/A**: the pipeline executes the components' existing tests; its own added logic is thin CLI orchestration + coverage-threshold parsing. Any pure parsing helper (e.g., coverage-number extraction, adequacy-output parsing) SHOULD have example-based tests; property tests are not required for this thin layer. Product-code PBT remains the responsibility of the `app`/`infra` units.

### NFR-03: Performance & Cost
- Stage 2 Kiro CLI runs only after Stage 1 passes (avoids paying for AI on failing PRs).
- Bound Stage 2 input (send changed test files + relevant business-rule context, not the whole repo) to control cost/latency; enforce a timeout.

### NFR-04: Observability
- Emit a structured summary: per-component pass/fail + coverage %, and Stage 2 verdict — no secrets.

### NFR-05: Resiliency (Extension: DISABLED)
Opted out (Q8=B). Fail-safe still covered by SECURITY-15.

---

## Constraints & Assumptions
- **C-01**: Gate orchestration language — thin CLI glue in the workflow (bash steps) invoking each component's native toolchain; the Stage 2 call runs the **Kiro CLI headless** (`kiro-cli chat --no-interactive`, pinned version).
- **C-02**: Stage 2 auth uses `KIRO_API_KEY` fetched from **AWS Secrets Manager via OIDC** at runtime (no static key in GitHub). A scoped `secretsmanager:GetSecretValue` grant is added to the existing OIDC role (`GitHubActionsDeployRole`). Kiro CLI is also used developer-locally.
- **C-03**: `infra/` must expose a coverage-capable test command; adding it (`npm test -- --coverage`) is in scope for Code Generation.
- **C-04**: Branch protection on `dev` must require the gate's status check for FR-06 to block merges (repo settings step — documented).
- **C-05**: The Kiro CLI binary must be installed (pinned version) on the CodeBuild runner; the Kiro-key secret must exist in AWS Secrets Manager (one-time bootstrap, documented).

## Key Requirements Summary
Extend `ci.yml` (PRs to `dev`) with a two-stage test-quality gate: **Stage 1** runs each component's existing tests (`app`=pytest, `infra`=TS/CDK) and enforces ~80% coverage per component (deterministic, blocking); **Stage 2** (only if Stage 1 passes) uses the **Kiro CLI headless** to judge whether new tests validate the affected business rules, with `KIRO_API_KEY` fetched from **Secrets Manager via OIDC** (no static key in GitHub). A required status check blocks merge unless both stages pass. Kiro CLI is used both developer-locally and in-pipeline (Stage 2). Security Baseline enforced (blocking); PBT downgraded to Partial (largely N/A for this thin gate); Resiliency disabled.

## Extension Compliance (Requirements stage)
| Extension | Status | Notes |
|---|---|---|
| Security Baseline | Enforced | NFR-01: Stage 2 = Kiro CLI; `KIRO_API_KEY` via Secrets-Manager-over-OIDC (no static GitHub key), scoped `secretsmanager:GetSecretValue`, constrained CLI tools, fail-closed, injection-safe |
| Property-Based Testing (Partial) | Enforced (largely N/A) | NFR-02: thin orchestration layer; example-based tests for any pure helper |
| Resiliency Baseline | Disabled | Q8=B; fail-safe via SECURITY-15 |
