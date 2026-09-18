# Logical Components — Unit: pr-test-quality-gate

## Where the code lives
- **Workflow**: extend `.github/workflows/ci.yml` (add a `quality-gate` job + supporting scripts)
- **Scripts**: `.github/scripts/pr-gate/` (bash + jq helpers)

```
.github/
├── workflows/ci.yml            # extended: add quality-gate job (Stage 1 + Stage 2)
└── scripts/pr-gate/
    ├── run_stage1.sh           # run app + infra tests, collect coverage
    ├── parse_coverage.sh       # PURE-ish: extract coverage % (jq/xmllint)   [example-tested]
    ├── stage1_verdict.sh       # PURE: aggregate ComponentTestResults        [example-tested]
    ├── run_stage2.sh           # OIDC->Secrets Manager (KIRO_API_KEY)->kiro-cli adequacy (only if Stage 1 passed)
    ├── parse_adequacy.sh       # PURE: parse Kiro CLI JSON -> verdict/rationale [example-tested]
    ├── compute_verdict.sh      # PURE: BR-GATE-09 precedence                  [example-tested]
    ├── report.sh               # I/O: upsert PR comment + set status (gh)
    └── tests/                  # example-based shell tests for the PURE helpers
```

## Pure vs I/O boundary
| Layer | Scripts | Testing |
|---|---|---|
| Pure helpers | `parse_coverage.sh`, `stage1_verdict.sh`, `parse_adequacy.sh`, `compute_verdict.sh` | Example-based shell tests (PBT N/A for glue — Partial mode) |
| I/O | `run_stage1.sh` (test runners), `run_stage2.sh` (Secrets Manager + Kiro CLI), `report.sh` (gh) | Exercised in integration/dry-run; mocked where feasible |

## Logical Components / External Dependencies
| Component | Role | Notes |
|---|---|---|
| `ci.yml` `quality-gate` job | Orchestrates the two stages | on PR to `dev`; CodeBuild runner |
| pytest + pytest-cov | app tests + coverage | existing app tooling |
| TS test runner + coverage | infra tests + coverage | jest/vitest/nyc; add if missing (C-03) |
| AWS OIDC role (existing) | Short-lived creds to read the Kiro secret | +scoped `secretsmanager:GetSecretValue` |
| AWS Secrets Manager secret | Stores `KIRO_API_KEY` | encrypted at rest; read at runtime; rotatable |
| Kiro CLI (headless) | Stage 2 adequacy engine | pinned version; constrained tools; JSON output |
| `gh` CLI | PR comment + status | ephemeral `GITHUB_TOKEN` |
| `jq` | JSON parsing / verdict | pinned |
| CodeBuild runner (existing) | Compute | reused via `runs-on` |

## Data-flow with components (text)
```
PR(dev) -> ci.yml quality-gate
  run_stage1.sh:
     app:   pytest --cov  -> parse_coverage.sh -> ComponentTestResult(app)
     infra: npm test --coverage -> parse_coverage.sh -> ComponentTestResult(infra)
     stage1_verdict.sh -> PASS/FAIL_STAGE1
  if PASS:
     configure-aws-credentials (OIDC)
     run_stage2.sh -> get KIRO_API_KEY from Secrets Manager (mask)
                   -> kiro-cli chat --no-interactive (changed tests + rule context, injection-safe, constrained tools)
                   -> parse_adequacy.sh -> AdequacyResult (ERROR on exit!=0/timeout/parse fail)
  compute_verdict.sh -> GateVerdict
  report.sh -> upsert PR comment (idempotent) + set required status check
  exit code reflects verdict (fail-closed on ERROR)
```

## Verdict → status mapping (BR-GATE-09/10)
| GateVerdict | Status check | Merge |
|---|---|---|
| PASS | success | allowed |
| FAIL_STAGE1 | failure | blocked (Stage 2 skipped) |
| FAIL_STAGE2 | failure | blocked |
| ERROR | failure | blocked (fail-closed) |
