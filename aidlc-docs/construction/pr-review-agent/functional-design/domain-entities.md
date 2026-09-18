# Domain Entities — Unit: pr-test-quality-gate

Technology-agnostic domain model for the two-stage test-quality gate.

## Entity: PullRequestContext
| Attribute | Type | Description |
|---|---|---|
| repo_owner | string | GitHub repo owner |
| repo_name | string | GitHub repo name |
| pr_number | integer | PR number |
| head_sha | string | Head commit SHA (status check target) |
| base_ref | string | Base branch (expected: `dev`) |
| changed_files | list[string] | Paths changed in the PR (used to scope components + Stage 2) |

## Entity: Component
A testable component with its own toolchain.
| Attribute | Type | Description |
|---|---|---|
| name | string | `app` or `infra` |
| path | string | `app/` or `infra/` |
| test_command | string | e.g., `pytest --cov` / `npm test -- --coverage` |
| coverage_min | number | Global minimum (default 80) |

## Entity: ComponentTestResult (Stage 1)
| Attribute | Type | Description |
|---|---|---|
| component | string | Component name |
| tests_passed | boolean | All tests passed |
| coverage_pct | number \| null | Measured line coverage |
| meets_threshold | boolean | coverage_pct >= coverage_min |
| detail | string | Summary / failing test names |

## Entity: AdequacyResult (Stage 2)
| Attribute | Type | Description |
|---|---|---|
| verdict | AdequacyVerdict | PASS / FAIL |
| rationale | string | Why the new tests do/don't validate the affected business rules |
| business_rules_considered | list[string] | Rules the check reasoned about |

## Value Object: AdequacyVerdict (enum)
`PASS` | `FAIL` | `ERROR` (engine/timeout → fail closed)

## Entity: GateResult
The overall outcome that drives the status check.
| Attribute | Type | Description |
|---|---|---|
| stage1 | list[ComponentTestResult] | Per-component results |
| stage2 | AdequacyResult \| null | null if Stage 1 failed (Stage 2 skipped) |
| verdict | GateVerdict | Computed final decision |
| summary_markdown | string | PR comment body |

## Value Object: GateVerdict (enum)
- `PASS` — all Stage 1 components pass tests + threshold, AND Stage 2 = PASS
- `FAIL_STAGE1` — any component fails tests or coverage threshold (Stage 2 skipped)
- `FAIL_STAGE2` — Stage 1 passed but Stage 2 = FAIL
- `ERROR` — infrastructure/engine error → fail closed

## Relationships (text)
```
PullRequestContext 1 --- * Component (scoped by changed_files)
Component 1        --> 1 ComponentTestResult (Stage 1)
GateResult 1       --- * ComponentTestResult
GateResult 1       --- 0..1 AdequacyResult (Stage 2, only if Stage 1 passed)
GateResult 1       --- 1 GateVerdict (computed)
```
