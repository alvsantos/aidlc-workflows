# Clarification — Test Approach (Q2 = "kiro-cli")

Your Q2 answer was "kiro-cli", which I want to interpret correctly rather than assume. I could not find a documented dedicated *test framework* primitive in the Kiro CLI (it runs prompts/agents and shell commands; it is not itself a shell unit-test framework). Please pick what you meant:

## Question 1
How should the Bash agent's tests be structured and run?

A) **Plain shell test scripts** (assertions via `[ ]`/exit codes, e.g., `tests/*.sh`) — no dedicated framework (bats/shunit2). They run in CI as a normal step (and can be invoked/authored with help from Kiro CLI).

B) Use **Kiro CLI in a CI step to *generate and/or run* the tests** as part of the workflow, on top of plain shell assertions (Kiro orchestrates; the assertions are still shell).

C) Actually, use a real shell framework after all — **bats-core**.

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---
