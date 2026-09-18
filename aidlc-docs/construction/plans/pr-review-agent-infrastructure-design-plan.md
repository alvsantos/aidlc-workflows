# Infrastructure Design Plan — Unit: pr-test-quality-gate

## Plan Checklist
- [x] Decide placement of the scoped grant (PipelineStack; Q2=A, update-if-exists)
- [x] Decide IAM identity model (reuse GitHubActionsDeployRole; Q1=A)
- [x] Define Stage 2 engine + auth + resource scoping (Kiro CLI; `secretsmanager:GetSecretValue` on Kiro key ARN)
- [x] Define ci.yml job wiring + repo variables
- [x] Define infra coverage tooling prerequisite (Q4=A, generate npm test --coverage)
- [x] Resolve clarifying questions (Q1=A, Q2=A update-if-exists, Q3→Kiro CLI via clarification, Q4=A)
- [x] Generate infrastructure-design.md and deployment-architecture.md

## Context (already decided)
- Stage 2 engine: **Amazon Bedrock via OIDC** (no stored key). GitHub via ephemeral `GITHUB_TOKEN`.
- Existing: `PipelineStack` (OIDC provider + `GitHubActionsDeployRole` scoped to repo) in `infra/stacks/pipeline-stack.ts`.
- Gate extends `ci.yml`; scripts in `.github/scripts/pr-gate/`.

---

## Clarifying Questions

### Question 1 — IAM identity for the gate's Bedrock call
Which role should the gate's Stage 2 assume to call Bedrock?

A) **Reuse the existing `GitHubActionsDeployRole`** and add a scoped `bedrock:InvokeModel` policy statement to it

B) **Create a new dedicated role** (e.g., `PrGateBedrockRole`) with ONLY `bedrock:InvokeModel`, assumed via the same OIDC provider (better separation of duties; the review job can't touch deploy permissions)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2 — Where the IAM change is defined (IaC)
How should the new IAM grant + config be provisioned?

A) **Add it to `PipelineStack`** (CDK) in `infra/stacks/pipeline-stack.ts` — versioned IaC, deployed via the existing bootstrap flow

B) **Document as a manual/bootstrap step** (no CDK change) — faster, but not IaC-managed

X) Other (please describe after [Answer]: tag below)

[Answer]: A (check if it exists, if so, update instead of creating new)

---

## Question 3 — Bedrock model scoping
How tightly should `bedrock:InvokeModel` be scoped?

A) A **specific model ARN** (e.g., one Claude model in `us-east-1`) — tightest least-privilege

B) A small set of allowed model ARNs (flexibility to switch models)

C) No preference — pick the tightest sensible default (single model ARN, configurable)

X) Other (please describe after [Answer]: tag below)

[Answer]: Where is bedrock, I want kiro cli

---

## Question 4 — `infra/` coverage tooling
The `infra/` TS project needs a coverage-capable test command for Stage 1. Today it has `package.json` but coverage may not be configured. Preference?

A) Add a coverage setup (e.g., `jest` + coverage, or `c8`/`nyc`) as part of Code Generation

B) Assume `infra/` already has (or the team will add) a `npm test -- --coverage`; the gate just calls it

C) No preference — recommend and implement the standard for CDK/TS

X) Other (please describe after [Answer]: tag below)

[Answer]: A (generate the npm test command)

---
