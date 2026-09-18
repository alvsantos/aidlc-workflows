# Scope Pivot — Test-and-Coverage Gate (Confirmation)

Your latest direction reframes the feature. Please confirm so I rewrite the artifacts correctly. Fill in `[Answer]:` and say "ready".

**New understanding**: The pipeline agent does NOT use an LLM to review diffs. It runs the **already-generated tests** for each affected component in its own language/framework (`app/` = pytest, `infra/` = TS/CDK tests), checks **coverage**, and validates **test adequacy**. Kiro CLI is used by the **developer locally** to author tests — it is NOT invoked in the pipeline. This removes the `KIRO_API_KEY` / Secrets Manager / OIDC-key machinery.

---

## Question 1 — Meaning of "validate what it needs to validate"
How should the agent assess test adequacy?

A) **Deterministic only** — coverage thresholds + structural checks (e.g., changed source files have corresponding tests; tests contain real assertions; coverage ≥ threshold). No AI/secret needed. Fully reproducible.

B) **AI-assisted adequacy** — an LLM reasons about whether tests meaningfully cover the change intent (reintroduces an LLM + secret in the pipeline).

X) Other (please describe after [Answer]: tag below)

[Answer]: X (we need a deterministic stage to check the general coverage + AI assisted after the coverage gate to check if the new tests validate what the business rule defines)

---

## Question 2 — Trigger (unchanged?)
Still run on pull requests to `dev`, with a required status check that blocks merge on failure?

A) Yes — same trigger + blocking status check as before

B) Different (describe)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3 — Coverage thresholds
What coverage policy should gate the PR?

A) A single global minimum (e.g., 80%) applied per component (app, infra)

B) Per-component thresholds (specify, e.g., app=85%, infra=70%)

C) No hard threshold yet — report coverage, block only on test failures (not on coverage)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4 — Scope of components
Which components' tests does the gate run?

A) Both `app/` (pytest) and `infra/` (TS/CDK tests), each with its own toolchain

B) Only `app/`

C) Only `infra/`

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5 — Relationship to existing `ci.yml`
`ci.yml` already runs `pytest app/tests/` and `cdk synth` on PRs to `dev`. Should this new gate:

A) Be a **separate** workflow focused on coverage + test-adequacy (coexists with ci.yml)

B) **Extend `ci.yml`** to add coverage + adequacy checks (no separate workflow)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---
