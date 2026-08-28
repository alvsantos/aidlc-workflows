# Requirements Clarification Questions

I detected two items that need clarification before I can generate accurate requirements.

---

## Clarification 1: AWS Blocks vs CDK/Terraform

You chose **AWS Blocks** as your primary IaC tool (Q1), but also said **Yes** to including a Terraform comparison (Q5).

**Background**: AWS Blocks is a relatively new higher-level abstraction built on top of AWS CDK. It uses CDK under the hood and generates CDK constructs, but provides a simpler, opinionated way to define AWS resources. This means:
- AWS Blocks **is** CDK (just a higher-level layer on top of it)
- Comparing AWS Blocks to Terraform is a valid and interesting comparison

### Clarification Question 1
How do you want to structure the IaC comparison?

A) AWS Blocks as primary (generates CDK under the hood) — compare it to pure CDK constructs AND Terraform in the README documentation (three-way comparison: AWS Blocks vs CDK vs Terraform, documented only)

B) AWS Blocks as primary implementation — compare only to Terraform in README (two-way comparison, documented only, no Terraform code)

C) Implement the same infrastructure twice: once in AWS Blocks (primary), once in Terraform — include both as runnable code in the repo

D) AWS Blocks only — drop the Terraform comparison (Q5 answer was exploratory)

X) Other (please describe after [Answer]: tag below)

[Answer]: B) AWS Blocks as primary implementation — compare only to Terraform in README

---

## Clarification 2: Pipeline Trigger for dev environment

You said (Q7): "On pull request to dev, on merge to main to prod"

This is slightly ambiguous. I want to confirm the exact branching and trigger model:

### Clarification Question 2
Which branching strategy do you want to use?

A) Feature branches → PR to `dev` branch (triggers CI: lint + test + deploy to dev) → merge `dev` to `main` (triggers CD: deploy to prod)

B) Feature branches → PR to `main` branch (triggers CI: lint + test + deploy to dev) → merge to `main` (triggers CD: deploy to prod)

C) Two long-lived branches: `dev` and `main` — PRs against `dev` trigger dev deploy, PRs merged to `main` trigger prod deploy

D) Simple: any PR triggers a test-only pipeline; merging to `main` triggers deploy to both dev then prod in sequence

X) Other (please describe after [Answer]: tag below)

[Answer]: A) Feature branches → PR to `dev` branch (triggers CI: lint + test + deploy to dev) → merge `dev` to `main` (triggers CD: deploy to prod)

---

Please fill in your answers above and let me know when done.
