# Units of Work

## Overview

The system is decomposed into 3 units of work. Each unit has a distinct technology stack, can be developed and tested independently, and has well-defined interfaces with other units.

**Development order**: `app` → `infra` → `pipeline`

---

## Unit 1: app

**Name**: `app`
**Type**: Application code
**Description**: Python REST API packaged as an AWS Lambda zip artifact. Implements the business logic and HTTP routing using AWS Lambda Powertools.

**Technology Stack**:
- Python 3.11
- AWS Lambda Powertools (ApiGatewayResolver, Logger, Tracer)
- pytest (unit testing)
- flake8 (linting)

**Responsibilities**:
- Implement `GET /health`, `GET /hello/{name}`, `GET /version` endpoints
- Validate input parameters
- Emit structured JSON logs via Powertools Logger
- Expose a single `handler(event, context)` Lambda entry point

**Directory**: `app/`

**Outputs** (consumed by `infra`):
- Lambda deployment zip artifact (built from `app/` directory)
- `requirements.txt` with pinned dependencies

**Dependencies**: None — this unit has no dependency on other units

**Environment-specific behaviour**:
- Reads `ENV` and `APP_VERSION` from Lambda environment variables (set by `infra`)

---

## Unit 2: infra

**Name**: `infra`
**Type**: Infrastructure as Code (AWS Blocks / CDK TypeScript)
**Description**: CDK application that provisions all AWS resources for the REST API. Uses AWS Blocks constructs where available. Deploys separate stacks for dev and prod environments.

**Technology Stack**:
- TypeScript
- AWS CDK v2
- AWS Blocks (CDK higher-level constructs)
- Node.js 18+

**Responsibilities**:
- Define `AppStack` provisioning Lambda + API Gateway HTTP API + IAM execution role + CloudWatch Log Group
- Handle environment-specific config (log retention, memory, stack naming) via CDK context
- Bundle `app/` directory as Lambda zip asset at synth time
- Export `ApiUrl` and `LambdaFunctionArn` as CloudFormation outputs

**Directory**: `infra/`

**Outputs** (consumed by `pipeline`):
- CDK app entry point (`infra/app.ts`) that `cdk deploy` targets
- Stack names: `AppStack-dev`, `AppStack-prod`
- CloudFormation outputs: `ApiUrl`, `LambdaFunctionArn`

**Dependencies**:
- `app/` — bundled as Lambda zip asset at CDK synth time

**Environment-specific behaviour**:
- `envName=dev`: 128 MB Lambda memory, 7-day log retention, stack name `AppStack-dev`
- `envName=prod`: 256 MB Lambda memory, 30-day log retention, stack name `AppStack-prod`

---

## Unit 3: pipeline

**Name**: `pipeline`
**Type**: CI/CD infrastructure + workflow definitions
**Description**: Two parts — (1) a CDK `PipelineStack` that provisions CodeBuild runner, OIDC provider, and IAM role as a one-time bootstrap; (2) GitHub Actions workflow YAML files that implement CI (PR to dev) and CD (merge to main) pipelines.

**Technology Stack**:
- TypeScript (CDK for PipelineStack)
- GitHub Actions YAML
- AWS CodeBuild

**Responsibilities**:
- Provision `PipelineStack`: CodeBuild project (GitHub Actions runner), OIDC IdP, `GitHubActionsDeployRole`
- Define `ci.yml`: triggered on PR to `dev` — lint, test, cdk synth, deploy to dev
- Define `cd.yml`: triggered on push to `main` — deploy to prod
- Define `deploy.yml`: reusable workflow called by both CI and CD

**Directory**: `infra/` (PipelineStack alongside AppStack), `.github/workflows/`

**Outputs**:
- Working CI/CD pipeline wired to GitHub repository
- `PipelineStack` CloudFormation outputs: `CodeBuildProjectName`, `DeployRoleArn`

**Dependencies**:
- `infra/` — pipeline deploys CDK stacks defined in the infra unit
- GitHub repository must exist before pipeline can be configured

**Code organisation**:
```
infra/
├── app.ts              ← CDK app entry (instantiates AppStack + PipelineStack)
├── stacks/
│   ├── app-stack.ts    ← AppStack (Lambda + API GW + IAM + CW)
│   └── pipeline-stack.ts ← PipelineStack (CodeBuild + OIDC + IAM role)
├── package.json
└── cdk.json

.github/
└── workflows/
    ├── ci.yml          ← PR to dev
    ├── cd.yml          ← push to main
    └── deploy.yml      ← reusable deploy workflow
```
