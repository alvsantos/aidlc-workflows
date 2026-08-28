# Application Design Plan

## Steps

- [x] Step 1: Collect answers to design questions
- [x] Step 2: Generate components.md
- [x] Step 3: Generate component-methods.md
- [x] Step 4: Generate services.md
- [x] Step 5: Generate component-dependency.md
- [x] Step 6: Generate application-design.md (consolidated)

---

## Design Questions

Please answer each question by filling in the letter choice after the `[Answer]:` tag.
Let me know when done.

---

## Question 1
Which Python web framework should the REST API use?

A) Flask — lightweight, minimal, well-known, large community, easy Lambda integration

B) FastAPI — modern, async-capable, auto-generates OpenAPI docs, type-safe with Pydantic

C) Either is fine — you decide based on what fits better for Lambda

X) Other (please describe after [Answer]: tag below)

[Answer]: Flask

---

## Question 2
How should the Python API be adapted to run on AWS Lambda?

A) Mangum — ASGI/WSGI adapter that wraps Flask/FastAPI for Lambda; single handler function

B) AWS Lambda Powertools for Python — adds tracing, logging, and event parsing on top of the handler

C) Both — Mangum for the adapter + Powertools for observability utilities

D) Plain Lambda handler with manual routing (no framework adapter)

X) Other (please describe after [Answer]: tag below)

[Answer]: B) AWS Lambda Powertools

---

## Question 3
What API endpoints should the application expose?

A) Minimal — GET /health (returns {"status": "ok"}) and GET /hello (returns {"message": "Hello, World!"})

B) Standard — GET /health, GET /hello/{name} (parameterized greeting), GET /version (returns app version/env info)

C) Extended — all of B plus POST /echo (echoes request body back) to demonstrate input validation

X) Other (please describe after [Answer]: tag below)

[Answer]: Standard — GET

---

## Question 4
How should the AWS Blocks / CDK IaC be structured?

A) Single stack file — all resources (Lambda, API GW, IAM, CloudWatch) in one AppStack class

B) Separate constructs — one file per concern (LambdaConstruct, ApiGatewayConstruct, ObservabilityConstruct) composed into AppStack

C) Nested stacks — separate CloudFormation stacks for app and infra concerns

X) Other (please describe after [Answer]: tag below)

[Answer]: A) Single stack file

---

## Question 5
How should dev/prod environment differences be handled in the CDK app?

A) CDK context (cdk.json) — pass environment name via context key, stack reads it at synth time

B) Environment variables at deploy time — pass via --context flag in the CLI/pipeline

C) Separate stack instantiations in app.ts — one AppStack-dev and one AppStack-prod with different props

D) CDK Environments (account + region) — fully separate account per environment

X) Other (please describe after [Answer]: tag below)

[Answer]: A) CDK context (cdk.json)

---

## Question 6
How should the GitHub Actions + CodeBuild integration be structured?

A) Single reusable workflow — one workflow file with inputs for environment name, called from CI and CD workflows

B) Two separate workflow files — ci.yml (PR to dev) and cd.yml (merge to main), each self-contained

C) Three files — a shared deploy.yml (reusable), ci.yml calling it for dev, cd.yml calling it for prod

X) Other (please describe after [Answer]: tag below)

[Answer]: A) Single reusable workflow 

---

## Question 7
Where should the CodeBuild project be defined?

A) As part of the CDK infra stack — CodeBuild project provisioned alongside Lambda/API GW via CDK

B) As a separate CDK stack (pipeline-stack.ts) — keeps CI/CD infra separate from app infra

C) Manually — CodeBuild project created once via AWS Console or CLI, not managed by CDK

X) Other (please describe after [Answer]: tag below)

[Answer]: B) As a separate CDK stack

---

## Question 8
How should AWS credentials be passed to GitHub Actions for deploying CDK stacks?

A) OIDC with a single IAM role — one role for both CI (deploy dev) and CD (deploy prod)

B) OIDC with two IAM roles — separate roles for dev deployment and prod deployment (tighter least-privilege)

C) OIDC with one role per environment, scoped by GitHub branch condition in the trust policy

X) Other (please describe after [Answer]: tag below)

[Answer]: A) OIDC with a single IAM role 
