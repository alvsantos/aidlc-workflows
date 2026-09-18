# PR Review Agent — Requirements Verification Questions

Please answer each question by filling in the letter choice after the `[Answer]:` tag. If none of the options match, choose the "Other" option and describe your preference after the tag. Let me know when you're done.

**Context note before you start:** Your current pipeline (`.github/workflows/`) triggers CI on **pull requests to `dev`**, and CD on **push/merge to `main`**. There are currently **no pull requests targeting `main`** in your branch strategy (`feature/* → PR to dev → merge to main`). Question 1 resolves how the reviewer should fit this reality.

---

## Question 1
Your request says "reviewing my pull requests to main", but today `main` receives merges (pushes), not PRs. How should the review agent be triggered?

A) Introduce a new PR-to-`main` flow (`dev → PR → main`) and run the agent on those PRs — this changes your branch strategy so `main` is only updated via reviewed PRs

B) Keep the current strategy but run the agent on PRs to `dev` (the existing PR gate before code eventually reaches `main`)

C) Run the agent on PRs to BOTH `dev` and `main` (adopt the new `dev → PR → main` flow AND keep the `dev` PR gate)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 2
What AI engine should power the autonomous review agent?

A) Amazon Bedrock (e.g., Claude via Bedrock) — AWS-native, invoked from the pipeline using the existing OIDC role

B) A third-party hosted LLM API (e.g., OpenAI/Anthropic direct API) via an API key stored as a GitHub secret

C) A prebuilt GitHub Action / marketplace reviewer (e.g., an existing "AI code review" action)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
What should the agent actually DO with its review? (select the primary behavior)

A) Post review comments on the PR (summary + inline/file comments) — informational only, never blocks merge

B) Post comments AND set a required status check that can block merge if it finds high-severity issues

C) Post comments AND approve/request-changes as a formal PR review (participates in GitHub's review state)

X) Other (please describe after [Answer]: tag below)

[Answer]: B (but also approve automatically if no coments are needed)

---

## Question 4
What should the agent focus its review on? (choose the scope)

A) Code quality + correctness only (bugs, logic, readability, style)

B) Code quality + security (OWASP-style issues, secrets, IAM/least-privilege in IaC) + correctness

C) Broad: quality, security, tests coverage, and adherence to this repo's conventions (Python app + CDK infra)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 5
How should the agent run within your CI/CD infrastructure?

A) As a new GitHub Actions workflow running on the existing AWS CodeBuild self-hosted runner (consistent with ci.yml/cd.yml)

B) As a new GitHub Actions workflow on GitHub-hosted runners (simpler; separate from the CodeBuild runner)

C) No preference — recommend the best fit and document the rationale

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6
How much autonomy should the agent have (guardrails)?

A) Fully autonomous — reviews every qualifying PR automatically with no human trigger

B) Autonomous by default, but skippable via a PR label or comment command (e.g., add label `skip-ai-review`)

C) On-demand only — runs when a reviewer comments a trigger (e.g., `/ai-review`) rather than on every PR

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7 — Security Extension (opt-in)
Should security extension rules be enforced for this feature?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended; this feature handles credentials/tokens and calls an LLM with your source code)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 8 — Resiliency Extension (opt-in)
Should the resiliency baseline be applied to this feature? It applies directional AWS Well-Architected (Reliability Pillar) design-time best practices. It does NOT certify production-readiness.

A) Yes — apply the resiliency baseline as directional best practices

B) No — skip the resiliency baseline (suitable for a developer-tooling/CI feature where rapid iteration matters more)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 9 — Property-Based Testing Extension (opt-in)
Should property-based testing (PBT) rules be enforced for this feature?

A) Yes — enforce all PBT rules as blocking constraints

B) Partial — enforce PBT only for pure functions and serialization round-trips

C) No — skip all PBT rules (suitable for a thin CI integration layer with limited algorithmic logic)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---
