# Business Rules — Unit: pr-test-quality-gate

Derived from requirements (FR-01..FR-09) and scope-pivot answers (Q1=X two-stage, Q2=A, Q3=A ~80% global, Q4=A both components, Q5=B extend ci.yml).

## BR-GATE-01: Trigger scope
The gate runs only on pull requests whose base branch is `dev`. *(FR-01)*

## BR-GATE-02: Extend ci.yml
The gate is implemented as added jobs/steps in `ci.yml`, sharing its trigger and CodeBuild runner; it must not remove existing lint/test/synth/deploy behavior. *(FR-02, FR-09)*

## BR-GATE-03: Component set
Components covered: `app` (pytest + coverage) and `infra` (TS/CDK test + coverage). A component is evaluated when the PR changes files under its path (or always, if configured). *(FR-03, Q4=A)*

## BR-GATE-04: Stage 1 — test execution
For each in-scope component, run its native test command. If any test fails, that component's `tests_passed=false`. *(FR-04)*

## BR-GATE-05: Stage 1 — coverage threshold
For each in-scope component, measure line coverage. `meets_threshold = coverage_pct >= coverage_min` (default 80, global per component, configurable). *(FR-04, Q3=A)*

## BR-GATE-06: Stage 1 gating
Stage 1 PASSES only if, for every in-scope component, `tests_passed=true` AND `meets_threshold=true`. Otherwise the gate verdict is `FAIL_STAGE1` and **Stage 2 is skipped**. *(FR-04, FR-06)*

## BR-GATE-07: Stage 2 — runs only after Stage 1 passes
The AI business-rule adequacy check (Kiro CLI headless) executes only when Stage 1 passed. It receives the new/changed test files and the business-rule context relevant to the changed files. *(FR-05, NFR-03)*

## BR-GATE-08: Stage 2 — adequacy verdict
Stage 2 runs `kiro-cli chat --no-interactive` with an injection-safe prompt and emits `PASS` (new tests meaningfully validate the affected business rules) or `FAIL` (they do not), with a rationale, as strict JSON. Kiro CLI non-zero exit (1/2), timeout, or malformed output → `ERROR`. *(FR-05)*

## BR-GATE-09: Final verdict precedence
Compute the gate verdict in order:
1. Any infra/engine error → **ERROR** (fail closed, BR-GATE-12)
2. Else if Stage 1 not all-pass → **FAIL_STAGE1**
3. Else if Stage 2 = FAIL → **FAIL_STAGE2**
4. Else → **PASS**

## BR-GATE-10: Blocking status check
The gate sets a required status check on the head SHA: PASS → success; FAIL_STAGE1 / FAIL_STAGE2 / ERROR → failure (blocks merge). *(FR-06)*

## BR-GATE-11: Reporting
Results are surfaced on the PR: per-component test outcome + coverage % (Stage 1) and adequacy verdict + rationale (Stage 2). *(FR-07)*

## BR-GATE-12: Fail-closed
Any unrecoverable error (test runner crash, coverage tool failure, Secrets Manager fetch failure, Kiro CLI error/timeout, malformed AI output) → verdict ERROR → failing check. Never pass silently on error. *(SECURITY-15)*

## BR-GATE-13: Stage 2 engine + auth (Kiro CLI via Secrets-Manager-over-OIDC)
Stage 2 uses the **Kiro CLI headless** authenticated with `KIRO_API_KEY`, which is fetched at runtime from **AWS Secrets Manager via the existing OIDC role** (no static key in GitHub) and masked. The Kiro CLI runs with a **constrained tool posture** (no `--trust-all-tools`). *(NFR-01, FR-05/FR-08)*

## BR-GATE-14: Untrusted content
PR content and test files are untrusted input; the Stage 2 prompt delimits them and ignores any embedded instructions (prompt-injection defense). *(SECURITY-05/11)*

## BR-GATE-15: No secrets in logs
Never log the OIDC/AWS credentials, the `KIRO_API_KEY`, or the GitHub token; coverage output/diffs only at DEBUG. *(SECURITY-03)*
