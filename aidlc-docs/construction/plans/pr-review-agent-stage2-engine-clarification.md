# Clarification — Stage 2 Engine (Bedrock vs Kiro CLI)

Your Q3 answer ("Where is bedrock, I want kiro cli") conflicts with two earlier decisions. I want to resolve it explicitly rather than assume.

**Recap of the tension:**
- You reframed the feature so **Kiro CLI is developer-local, NOT invoked in the pipeline** (FR-08). Stage 2 (the AI "do these tests validate the business rules?" check) still needs *an engine in the pipeline*. Given your stated preference for **OIDC/IAM over API keys**, I set Stage 2 = **Amazon Bedrock via OIDC** (no stored key).
- **Kiro CLI in the pipeline** requires `KIRO_API_KEY` (its documented headless auth) — there is **no documented OIDC/IAM-role auth for Kiro CLI**. That API-key requirement is the exact thing that worried you earlier.

Please pick the Stage 2 engine direction:

## Question 1 — Stage 2 engine
A) **Keep Amazon Bedrock via OIDC** (no stored key). Consistent with your OIDC-over-keys preference and FR-08 (Kiro stays developer-local). *(current design)*

B) **Use Kiro CLI in the pipeline for Stage 2** — reverses FR-08. Requires `KIRO_API_KEY` in the pipeline; to avoid a static key we'd fetch it from **AWS Secrets Manager via OIDC** at runtime (the pattern from earlier). Accepts a long-lived Kiro key existing in AWS (rotatable, audited) rather than none.

C) **Drop the AI Stage 2 entirely** — make the gate purely deterministic (tests + coverage only). No engine, no key. Simplest + most secure; loses the "tests validate business rules" AI judgment.

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 2 — Only if you chose B: confirm the auth
If Stage 2 uses Kiro CLI, how should `KIRO_API_KEY` be provided?

A) Fetch from **AWS Secrets Manager via OIDC** at runtime (no static key in GitHub) — recommended if B

B) Plain **GitHub Actions secret** (simplest, but a long-lived key in GitHub — you objected to this before)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

**Note on Q1/Q2 (unaffected, already accepted):** IAM grant lives in `PipelineStack` (update if it exists, else create) — Q2=A. `infra/` coverage command will be generated — Q4=A. These stand regardless of the engine choice (the IAM grant becomes `bedrock:InvokeModel` for option A, or `secretsmanager:GetSecretValue` for option B, or none for option C).
