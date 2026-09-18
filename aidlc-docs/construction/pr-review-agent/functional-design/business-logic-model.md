# Business Logic Model — Unit: pr-test-quality-gate

## Overview
The gate is added to `ci.yml` (PRs to `dev`) on the existing CodeBuild runner. It has two stages: a deterministic per-component test+coverage gate, then (only on pass) an AI business-rule adequacy check via the **Kiro CLI headless** (`KIRO_API_KEY` fetched from Secrets Manager via OIDC; constrained tools). Kiro CLI is also used developer-locally to author tests.

## End-to-End Flow

```
GitHub Actions ci.yml (PR to dev: opened/reopened/synchronize)
      |
      v
[existing steps: lint, unit tests, cdk synth]  (unchanged, FR-09)
      |
      v
=== STAGE 1: Deterministic Coverage Gate (per component) ===
  for each in-scope component (app: pytest --cov ; infra: npm test --coverage):
      run tests ------------------------> tests_passed?
      measure coverage -----------------> coverage_pct >= coverage_min (default 80)?
  aggregate -> Stage1 pass = ALL components (tests_passed AND meets_threshold)
      |
      | Stage1 FAIL                              | Stage1 PASS
      v                                          v
  verdict = FAIL_STAGE1                    === STAGE 2: AI Business-Rule Adequacy ===
  (skip Stage 2)                             assume OIDC role -> get KIRO_API_KEY from Secrets Manager (mask)
      |                                        run: kiro-cli chat --no-interactive (constrained tools)
      |                                        input: changed test files + business-rule context
      |                                        prompt: injection-safe, delimited (BR-GATE-14)
      |                                        output: {verdict: PASS|FAIL, rationale} (strict JSON)
      |                                          |
      |                                    parse -> AdequacyResult (ERROR on exit!=0/timeout/parse fail)
      |                                          |
      |                                          v
      |                                    compute_gate_verdict()
      +---------------------+--------------------+
                            v
              [report to PR] summary comment + set required status check (BR-GATE-10/11)
                            v
              exit code reflects verdict (fail-closed on ERROR)
```

## Functions (logical)

### Pure functions (example-based tests; PBT Partial → largely N/A)
- `compute_gate_verdict(stage1_results, stage2_result, error) -> GateVerdict`: precedence per BR-GATE-09. Deterministic.
- `parse_coverage(report_text|xml) -> coverage_pct`: extract line-coverage number from the tool output.
- `meets_threshold(pct, minimum) -> bool`.
- `parse_adequacy_response(text) -> AdequacyResult`: parse Kiro CLI JSON output (verdict + rationale).
- `render_summary(gate_result) -> markdown`.

### I/O functions (mocked in tests)
- `run_component_tests(component) -> ComponentTestResult`: invoke native toolchain (subprocess).
- `fetch_kiro_key() -> str`: read `KIRO_API_KEY` from Secrets Manager via OIDC creds (boto3/CLI); mask.
- `invoke_kiro_cli(prompt) -> text`: run `kiro-cli chat --no-interactive` (constrained tools, timeout); check exit code.
- `fetch_changed_files(context) -> list[str]`, `upsert_summary_comment`, `set_status` — via `gh`/GitHub API.

## Testable Properties (PBT-01, extension = PARTIAL)

PBT Partial enforces PBT-02/03/07/08/09 **where applicable**. This unit is a thin CI orchestration + coverage-parsing layer that mostly runs *other* components' tests, so most PBT rules are **N/A**. Documented per candidate:

| Component | Property | Applicability |
|---|---|---|
| `compute_gate_verdict` | Invariant: any Stage-1 fail ⇒ FAIL_STAGE1 & Stage 2 skipped; error ⇒ ERROR | Advisory (example-based tests suffice; deterministic small enum logic) |
| `parse_coverage` | Round-trip-ish: `parse(render(pct)) == pct` within tolerance | PBT-02 candidate — **optional**; example-based tests required |
| `parse_adequacy_response` | Invariant: malformed input never crashes; yields ERROR | Example-based tests required |

**Decision**: For this gate unit, PBT rules are marked **N/A with rationale** ("thin orchestration layer; product-code PBT belongs to app/infra units"). Example-based tests are REQUIRED for the pure parsing/verdict helpers (PBT-10 complementary testing). This satisfies Partial-mode intent without a PBT framework burden on glue code.

## Data Flow Summary
- **Inputs**: PR event (untrusted), changed files, per-component coverage reports, business-rule context, changed test files.
- **Transformations**: run tests → coverage numbers → Stage 1 verdict → (if pass) Kiro CLI adequacy → gate verdict → markdown/status.
- **Outputs**: PR summary comment, required status check, exit code (fail-closed on error).
