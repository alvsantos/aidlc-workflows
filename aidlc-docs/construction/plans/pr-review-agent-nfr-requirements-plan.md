# NFR Requirements Plan — Unit: pr-review-agent

> **⚠️ SUPERSEDED (2026-09-17)**: This plan reflects the earlier Kiro-CLI-headless + Python + Secrets-Manager design. The feature was reframed to a **two-stage test-quality gate** (deterministic coverage + Bedrock-via-OIDC adequacy; Kiro CLI is developer-local). See the current `nfr-requirements/` artifacts and the scope-pivot change in `audit.md`. Kept for history only.

## Plan Checklist
- [x] Confirm tech-stack choices (language, GitHub client, Kiro CLI invocation, PBT framework)
- [x] Define security requirements mapping (Security Baseline rules → this unit)
- [x] Define performance/cost requirements (diff size threshold, timeout)
- [x] Define observability & maintainability requirements
- [x] Resolve clarifying questions below (Q1=C gh CLI, Q2=A pinned install, Q3=B ~200KB, Q4=A 5min, Q5=B inline+summary)
- [x] Generate nfr-requirements.md and tech-stack-decisions.md

---

## Clarifying Questions

Already decided in prior stages (no need to re-ask): agent language = **Python**; auth = **KIRO_API_KEY** secret; PBT framework = **Hypothesis**; fail-closed on error; oversized PRs skipped. The questions below fill the remaining gaps.

### Question 1 — GitHub API client
How should the agent talk to the GitHub API (fetch diff, post comments, set status, approve)?

A) Use the GitHub REST API via the lightweight `requests` library + the `GITHUB_TOKEN` (minimal deps)

B) Use the `PyGithub` library (higher-level client, more deps)

C) Use the `gh` CLI (GitHub CLI) already available on many runners

X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 2 — Kiro CLI availability on the runner
How should the Kiro CLI be made available in the workflow?

A) Install a pinned version as a step in the workflow (download official binary, pinned version) — reproducible

B) Assume it is pre-baked into the CodeBuild runner image (no install step)

C) No preference — recommend the most reproducible/secure approach

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 3 — Diff size threshold (oversized-PR skip, BR-PRA-07)
What default maximum diff size should trigger the "skip + ask to split" behavior? (Configurable via env var regardless.)

A) ~50 KB of diff text (conservative; keeps CLI cost/latency low)

B) ~200 KB of diff text (moderate)

C) No preference — pick a sensible default and make it configurable

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 4 — Review time budget / timeout
What timeout should bound a single Kiro CLI review invocation before it's treated as an error (fail-closed)?

A) 5 minutes

B) 10 minutes

C) No preference — pick a sensible default and make it configurable

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 5 — Inline comments vs summary-only
Requirement FR-05 allows file/line comments "where feasible." For the first version, what should the agent post?

A) Summary comment only (simpler, robust; severity-grouped findings listed in one comment)

B) Summary comment + inline file/line comments when the model provides a line number

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---
