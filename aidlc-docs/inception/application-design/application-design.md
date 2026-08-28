# Application Design

## Overview

This project consists of three units of work, each with a distinct technology stack and clear interfaces between them:

| Unit | Technology | Responsibility |
|---|---|---|
| `app` | Python 3.11 + Flask style via Powertools | REST API — Lambda handler, route controllers, structured logging |
| `infra` | AWS Blocks / CDK (TypeScript) | IaC — provisions Lambda, API GW, IAM, CloudWatch per environment |
| `pipeline` | GitHub Actions + CDK (TypeScript) | CI/CD — CodeBuild runner, OIDC, reusable deploy workflow |

---

## Architecture Diagram

```
+-------------------------------------------------------------+
|                        GitHub Repository                    |
|                                                             |
|  Feature branch                                             |
|      |                                                      |
|      | PR to dev                                            |
|      v                                                      |
|  GitHub Actions: ci.yml                                     |
|      |-- lint (flake8)                                      |
|      |-- unit tests (pytest)                                |
|      |-- cdk synth                                          |
|      |-- deploy.yml (environment=dev)                       |
|                          |                                  |
|      Merge to main       |                                  |
|      v                   |                                  |
|  GitHub Actions: cd.yml  |                                  |
|      |-- deploy.yml (environment=prod)                      |
+-------------------------------------------------------------+
                           |
                           | OIDC: AssumeRoleWithWebIdentity
                           v
+-------------------------------------------------------------+
|                     AWS CodeBuild Runner                    |
|   (executes GitHub Actions jobs as self-hosted runner)      |
|                                                             |
|   cdk deploy AppStack-dev / AppStack-prod                   |
+-------------------------------------------------------------+
                           |
              +------------+------------+
              |                         |
              v                         v
+-------------------------+   +-------------------------+
|   AppStack-dev          |   |   AppStack-prod         |
|                         |   |                         |
|  Lambda (Python 3.11)   |   |  Lambda (Python 3.11)   |
|    ApiHandler           |   |    ApiHandler           |
|    HealthController     |   |    HealthController     |
|    HelloController      |   |    HelloController      |
|    VersionController    |   |    VersionController    |
|       |                 |   |       |                 |
|  API Gateway HTTP API   |   |  API Gateway HTTP API   |
|  CloudWatch Log Group   |   |  CloudWatch Log Group   |
|  IAM Execution Role     |   |  IAM Execution Role     |
+-------------------------+   +-------------------------+
```

---

## Design Decisions Captured

| Decision | Chosen | Rationale |
|---|---|---|
| Python framework | Flask (via Powertools ApiGatewayResolver) | Lightweight, Powertools provides Lambda-native routing without a separate ASGI adapter |
| Lambda adapter | AWS Lambda Powertools | Eliminates Mangum dependency; Powertools handles API GW event routing natively and adds structured logging, tracing, and input validation utilities |
| API endpoints | Standard (health, hello/{name}, version) | Demonstrates path params, input validation, and env-aware responses — sufficient for the assignment without over-engineering |
| CDK structure | Single AppStack class | Project is small enough that a single stack file is maintainable; separate constructs would add file navigation overhead with no real benefit at this scale |
| Environment separation | CDK context (`cdk.json`) | Clean, no env vars required at deploy time; stack reads `envName` context key and applies env-specific config (log retention, memory, stack name) |
| GitHub Actions structure | Reusable `deploy.yml` called from `ci.yml` and `cd.yml` | DRY — deploy logic is defined once; CI and CD workflows only differ in trigger and environment name |
| CodeBuild project location | Separate `PipelineStack` | Keeps CI/CD infrastructure concerns separate from application infrastructure; `PipelineStack` is deployed once as a bootstrap step |
| AWS auth in pipeline | Single OIDC IAM role | Simple, secure — no long-lived credentials; single role is sufficient since dev/prod are in the same account; trust policy is scoped to the specific GitHub repo |

---

## Security Compliance Summary (Application Design stage)

| Rule | Status | Notes |
|---|---|---|
| SECURITY-06 (Least-privilege IAM) | Compliant | `LambdaExecutionRole` uses only `AWSLambdaBasicExecutionRole`; `GitHubActionsDeployRole` scoped to CDK bootstrap roles only |
| SECURITY-08 (App-level access control) | Compliant | Input validation defined on `HelloController`; all routes are public (no auth required for this demo API) |
| SECURITY-09 (Hardening) | Compliant | No default credentials; error handling returns generic messages (defined in `ApiHandler`) |
| SECURITY-12 (No hardcoded credentials) | Compliant | OIDC used; no IAM keys anywhere in design |
| SECURITY-01–15 (remaining) | N/A at this stage | Applicable rules will be enforced in NFR Requirements + NFR Design stages per unit |

---

## Files in This Design

| File | Contents |
|---|---|
| `components.md` | All components across 3 units with responsibilities |
| `component-methods.md` | Method signatures, inputs/outputs, business rules |
| `services.md` | Service orchestration patterns and workflows |
| `component-dependency.md` | Dependency matrix, communication patterns, deployment order |
| `application-design.md` | This file — consolidated overview |
