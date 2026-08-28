# Requirements Clarification Questions

Please answer each question by filling in the letter choice after the `[Answer]:` tag.
If none of the options match, choose the last option (Other) and describe your preference.
Let me know when you're done.

---

## Question 1
What IaC tool do you want to use as your primary implementation?

A) AWS CDK (TypeScript)

B) AWS CDK (Python)

C) AWS CDK (Java)

D) AWS CloudFormation (YAML/JSON)

E) Terraform (as primary, CDK as comparison)

X) Other (please describe after [Answer]: tag below)

[Answer]: AWS Blocks, because I already know terraform and CDK, and I want to know the essential differences and tradeoffs of them.

---

## Question 2
What CI/CD platform do you want to use with CodeBuild as the hosted runner?

A) GitHub Actions (CodeBuild as the runner via GitHub Actions self-hosted runner integration)

B) GitLab CI/CD (CodeBuild as the runner via GitLab Runner integration)

C) AWS CodePipeline (CodeBuild as the build/deploy stage)

D) I'm not sure — recommend what makes most sense

X) Other (please describe after [Answer]: tag below)

[Answer]: GitHub Actions

---

## Question 3
What sample application do you want to deploy through the pipeline? (The pipeline needs something to build and deploy)

A) A simple static website (HTML/CSS/JS)

B) A simple Node.js/Express REST API

C) A simple Python (Flask/FastAPI) REST API

D) A "Hello World" Lambda function

E) I don't need a real app — just demonstrate the pipeline infrastructure itself with a placeholder

X) Other (please describe after [Answer]: tag below)

[Answer]: C) A simple Python (Flask/FastAPI) REST API

---

## Question 4
Where should the sample application be deployed?

A) AWS Lambda (serverless function)

B) Amazon ECS on Fargate (containerized)

C) Amazon EC2 (virtual machine)

D) AWS Elastic Beanstalk (bonus requirement)

E) AWS Amplify Hosting (bonus requirement — best for static sites)

X) Other (please describe after [Answer]: tag below)

[Answer]: A) AWS Lambda 

---

## Question 5
Do you want to include the Terraform comparison (bonus requirement)?

A) Yes — include Terraform alongside CDK and document the comparison in README

B) No — focus only on the primary IaC tool chosen in Question 1

C) Yes, but only as documentation/comparison notes, not actual Terraform code

X) Other (please describe after [Answer]: tag below)

[Answer]: A) Yes 

---

## Question 6
What environments do you need in your pipeline?

A) Single environment (one stage: deploy to production)

B) Two environments (dev → prod)

C) Three environments (dev → staging → prod)

D) Just one environment for demo purposes is fine

X) Other (please describe after [Answer]: tag below)

[Answer]: B) Two environments (dev → prod)

---

## Question 7
How should the pipeline be triggered?

A) On every push to any branch

B) On push to main/master branch only

C) On pull request creation/update (PR-based)

D) On push to main + pull requests (both)

X) Other (please describe after [Answer]: tag below)

[Answer]: C) On pull request to dev, on merge to main to prod

---

## Question 8
What testing should the pipeline include?

A) No tests — just build and deploy

B) Linting / static analysis only

C) Unit tests only

D) Unit tests + integration tests

E) Unit tests + CDK/IaC validation (e.g., cdk diff, cfn-lint, tflint)

X) Other (please describe after [Answer]: tag below)

[Answer]: C) Unit tests only

---

## Question 9
What is your source code repository hosting preference?

A) GitHub (public repository)

B) GitHub (private repository)

C) GitLab (gitlab.com)

D) AWS CodeCommit

X) Other (please describe after [Answer]: tag below)

[Answer]: A) GitHub (public repository)

---

## Question 10
How detailed do you want the architecture decision documentation (README)?

A) Minimal — just list the tools chosen and why

B) Standard — include architecture diagram, tool comparisons, and key decisions

C) Comprehensive — include detailed ADRs (Architecture Decision Records) for every major choice, tradeoffs analysis, lessons learned

X) Other (please describe after [Answer]: tag below)

[Answer]: B) Standard

---

## Extension Opt-In Questions

## Question 11
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: A) Yes 

---

## Question 12
Should the resiliency baseline be applied to this project?

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: B) No

---

## Question 13
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints

B) Partial — enforce PBT rules only for pure functions and serialization round-trips

C) No — skip all PBT rules (suitable for simple infrastructure projects or thin integration layers)

X) Other (please describe after [Answer]: tag below)

[Answer]: C) No
