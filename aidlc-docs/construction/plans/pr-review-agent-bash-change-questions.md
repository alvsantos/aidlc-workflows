# Bash + Partial-PBT — Confirmation Questions

You chose: implement the agent in **Bash** and drop **PBT Full → Partial**. Two quick confirmations so I rewrite the design correctly. Fill in `[Answer]:` and say "ready".

## Question 1 — PBT applicability in Bash
Bash has no property-based testing framework (no Hypothesis/fast-check equivalent). How should we honor "Partial PBT"?

A) Mark PBT rules **N/A for this unit** with documented rationale ("implementation language is Bash; no shell PBT framework exists"), and rely on thorough **example-based** shell tests instead — recommended and honest

B) Extract the pure logic (verdict decision + JSON parsing) into a tiny **non-Bash** helper that CAN be property-tested (e.g., a small Python/`jq` component) while keeping Bash orchestration

X) Other (please describe after [Answer]: tag below)

[Answer]: A 

---

## Question 2 — Shell test framework
Which test framework for the Bash agent?

A) **bats-core** (Bash Automated Testing System) — most common for shell

B) **shunit2**

C) No preference — pick the standard (bats-core)

X) Other (please describe after [Answer]: tag below)

[Answer]: X) kiro-cli

---

## Question 3 — JSON handling in Bash
The Kiro CLI must still emit structured JSON so verdict logic is deterministic. Confirm the tool:

A) Use **`jq`** to parse findings and compute the verdict (severity → block/approve) — standard, pinned version

X) Other (please describe after [Answer]: tag below)

[Answer]: A
