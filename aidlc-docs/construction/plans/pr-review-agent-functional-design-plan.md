# Functional Design Plan — Unit: pr-review-agent

## Plan Checklist
- [x] Define domain entities (PullRequest, DiffFile, Finding, ReviewResult)
- [x] Define business logic model (fetch diff → build prompt → call Bedrock → parse → classify → decide verdict → post)
- [x] Define business rules (severity mapping, verdict decision, diff-size handling, fail-safe)
- [x] Identify testable properties (PBT-01) for pure logic
- [x] Resolve clarifying questions below (Q1=B, Q2=A, Q3=A, Q4=C, Q5=A, Q6=B)
- [x] Generate functional-design artifacts

---

## Clarifying Questions

Please answer each by filling in the `[Answer]:` tag. Choose "Other" and describe if none fit.

### Question 1 — Severity levels
What severity taxonomy should the agent use to classify findings?

A) High / Medium / Low (3 levels) — simplest

B) High / Medium / Low / Info (4 levels) — adds non-actionable observations

C) Critical / High / Medium / Low / Info (5 levels) — most granular

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 2 — Blocking threshold
Requirement FR-06 blocks merge on "high-severity" findings. Which severities should FAIL the status check (block merge)?

A) Only the top level (e.g., High or Critical) blocks; everything else is informational

B) The top TWO levels block (e.g., Critical + High)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 3 — Auto-approve condition (FR-07)
When exactly should the agent submit a formal GitHub approval?

A) Only when there are ZERO findings of any severity

B) When there are no blocking findings (i.e., only Low/Info findings exist) — still approve, but leave comments

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 4 — Large diff / token limits (NFR-03)
How should the agent handle very large PRs that exceed a safe token budget for Bedrock?

A) Truncate the diff to a configurable max size and note in the review that truncation occurred

B) Review file-by-file in chunks and aggregate findings (higher cost/latency, more thorough)

C) Skip review and post a comment asking the author to split the PR (does not block)

X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 5 — Fail-safe behavior on agent error (SECURITY-15)
If the agent errors (Bedrock unavailable, timeout, malformed response), what should the status check do?

A) Fail closed — status check FAILS (blocks merge) with a clear error message; safest

B) Fail open — status check PASSES with a warning comment; prioritizes developer flow over the gate

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 6 — Re-review on PR updates
When a PR is updated with new commits, should the agent re-review?

A) Yes — re-review the full diff on every push, replacing/updating its prior summary comment

B) Yes — re-review, but only post a new comment if the verdict changes

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---
