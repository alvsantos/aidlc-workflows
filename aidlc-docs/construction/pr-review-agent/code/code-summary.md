# Code Summary — Unit: pr-test-quality-gate

## Files Created
- `.github/scripts/pr-gate/parse_coverage.sh` — PURE: extract coverage % (XML/JSON)
- `.github/scripts/pr-gate/stage1_verdict.sh` — PURE: aggregate per-component Stage 1 verdict
- `.github/scripts/pr-gate/parse_adequacy.sh` — PURE: parse Kiro CLI JSON → PASS/FAIL/ERROR
- `.github/scripts/pr-gate/compute_verdict.sh` — PURE: final gate verdict precedence (BR-GATE-09)
- `.github/scripts/pr-gate/run_stage1.sh` — I/O: run app+infra tests + coverage
- `.github/scripts/pr-gate/prompt.tmpl` — injection-safe Stage 2 prompt template
- `.github/scripts/pr-gate/run_stage2.sh` — I/O: OIDC→Secrets Manager→Kiro CLI adequacy
- `.github/scripts/pr-gate/report.sh` — I/O: idempotent PR comment + commit status (gh)
- `.github/scripts/pr-gate/tests/test_helpers.sh` — example-based tests for the pure helpers
- `infra/test/pipeline-stack.test.ts` — jest test incl. GetSecretValue grant assertion

## Files Modified
- `.github/workflows/ci.yml` — added `quality-gate` job (Stage 1 + Stage 2); existing jobs untouched
- `infra/package.json` — added `test` script (jest --coverage) + jest/ts-jest devDeps + jest config
- `infra/stacks/pipeline-stack.ts` — added scoped `secretsmanager:GetSecretValue` statement to `GitHubActionsDeployRole` inline policy; added optional `kiroSecretArn` prop
- `infra/app.ts` — thread `kiroSecretArn` context into PipelineStack

## Verification performed during generation
- `bash .github/scripts/pr-gate/tests/test_helpers.sh` → **18 passed, 0 failed**
- `npx tsc --noEmit` (infra) → clean
- `npx cdk synth PipelineStack` → renders `secretsmanager:GetSecretValue` on `GitHubActionsDeployRole`
- `npm test` (infra) → **3 passed**; `coverage/coverage-summary.json` produced; `pipeline-stack.ts` 100%

## Verdict → status mapping
| GateVerdict | commit status | merge |
|---|---|---|
| PASS | success | allowed |
| FAIL_STAGE1 | failure | blocked |
| FAIL_STAGE2 | failure | blocked |
| ERROR | failure | blocked (fail-closed) |

## Security notes
- `KIRO_API_KEY` never stored in GitHub — fetched from Secrets Manager via OIDC, masked (`::add-mask::`).
- Scoped `secretsmanager:GetSecretValue` on a single secret ARN (no wildcards).
- Kiro CLI run without `--trust-all-tools`; untrusted PR/test content is delimited in the prompt.
- All external calls fail-closed → ERROR verdict → failing check.

## Notes / prerequisites
- The Kiro CLI install step in `ci.yml` is a **pinned placeholder** — set `KIRO_CLI_VERSION` and the official installer URL before first run (documented in README bootstrap).
- `infra/` had no prior tests; a minimal jest test was added so coverage is produced. Teams should expand infra tests toward the coverage threshold.
