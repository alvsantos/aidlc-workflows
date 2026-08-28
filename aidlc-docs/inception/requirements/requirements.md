# Requirements

## Intent Analysis

- **User Request**: Build an IaC project using AWS Blocks with a CI/CD pipeline (GitHub Actions + AWS CodeBuild as hosted runner), deploying a Python Flask/FastAPI REST API to AWS Lambda across dev and prod environments. Document architecture decisions, tool comparisons (AWS Blocks vs Terraform), and learnings.
- **Request Type**: New Project (Greenfield)
- **Scope Estimate**: Multiple components — IaC infrastructure, application code, CI/CD pipeline, documentation
- **Complexity Estimate**: Moderate-to-Complex — involves multiple AWS services, two environments, CI/CD integration, and a tool comparison study

---

## Functional Requirements

### FR-01: IaC Infrastructure (AWS Blocks — Primary)
- The project MUST use **AWS Blocks** as the primary IaC tool
- AWS Blocks generates CDK constructs under the hood; the CDK app is the deployable artifact
- The IaC code MUST provision:
  - AWS Lambda function (Python runtime) for the REST API
  - Amazon API Gateway (HTTP API or REST API) to expose the Lambda
  - IAM roles and policies with least-privilege permissions for Lambda execution
  - CloudWatch Log Groups for Lambda function logging
  - Environment-specific configuration (dev vs prod) via CDK context or environment variables

### FR-02: Sample Application
- A **Python REST API** (Flask or FastAPI) MUST be implemented as the sample application
- The API MUST expose at least one functional endpoint (e.g., `GET /health` returning `{"status": "ok"}` and `GET /hello` returning a greeting)
- The application MUST be packaged for Lambda deployment (zip artifact or container image)
- Unit tests MUST be written for the API endpoints using pytest

### FR-03: CI/CD Pipeline (GitHub Actions + CodeBuild)
- The pipeline MUST use **GitHub Actions** as the orchestration layer
- **AWS CodeBuild** MUST be used as the hosted runner for GitHub Actions (via the GitHub Actions runner on CodeBuild integration)
- The pipeline MUST consist of two workflows:
  - **CI Workflow** (Pull Request to `dev` branch): lint, unit tests, IaC validation (cdk synth), deploy to dev environment
  - **CD Workflow** (Merge to `main` branch): deploy to prod environment

### FR-04: Branching Strategy
- Repository MUST have two long-lived branches: `dev` and `main`
- Feature branches are created from `dev`
- PRs to `dev` trigger the CI workflow (test + deploy to dev)
- Merging `dev` to `main` triggers the CD workflow (deploy to prod)

### FR-05: Two Deployment Environments
- **dev** environment: deployed on PR to `dev` branch — used for integration testing
- **prod** environment: deployed on merge to `main` — represents production
- Each environment MUST have its own isolated AWS Lambda function and API Gateway endpoint
- Environment separation MUST be achieved via CDK environment context or stack naming conventions (e.g., `AppStack-dev`, `AppStack-prod`)

### FR-06: IaC Tool Comparison Documentation
- The README MUST include a **two-way comparison** between AWS Blocks and Terraform
- The comparison MUST cover: abstraction level, learning curve, AWS-native vs cloud-agnostic, state management, CDK ecosystem vs Terraform providers, and recommended use cases
- No Terraform code is required — documentation comparison only

### FR-07: Architecture Documentation (README)
- The README MUST include:
  - Architecture diagram showing all components (GitHub → CodeBuild → Lambda + API Gateway)
  - Pipeline configuration overview (trigger rules, stages, environment mapping)
  - AWS Blocks vs Terraform comparison table
  - Key architecture decisions and their rationale
  - Setup and deployment instructions
  - Learnings and observations

---

## Non-Functional Requirements

### NFR-01: Security
- Security extension rules are **enabled** and enforced as blocking constraints
- IAM roles MUST follow least-privilege principle (FR-01 already references this)
- No AWS credentials MUST be hardcoded in source code or pipeline configuration
- AWS credentials for GitHub Actions MUST use **OIDC (OpenID Connect)** federation — no long-lived access keys stored as GitHub secrets
- Lambda function environment variables containing sensitive data MUST use AWS Secrets Manager or SSM Parameter Store — not plaintext env vars
- API Gateway MUST have basic request validation enabled
- All Lambda function logs MUST be routed to CloudWatch Logs

### NFR-02: Maintainability
- IaC code MUST be organized into logical constructs (separate files/classes for Lambda, API Gateway, IAM)
- Pipeline YAML files MUST be well-commented explaining each step
- README MUST be kept up-to-date as the source of architectural truth

### NFR-03: Reproducibility
- The CDK stack MUST be fully deployable from a clean environment using documented setup steps
- All dependency versions (Python packages, CDK version, Node.js version for CDK CLI) MUST be pinned

### NFR-04: Observability
- Lambda function MUST emit structured logs to CloudWatch
- API Gateway access logging MUST be enabled
- CloudWatch Log Group retention MUST be set (e.g., 7 days for dev, 30 days for prod)

### NFR-05: Cost Awareness
- All resources provisioned MUST be within AWS Free Tier limits where possible (Lambda, API Gateway HTTP API, CloudWatch basic metrics)
- Dev environment SHOULD use minimal resource configuration to reduce cost

---

## Architecture Decisions (to be documented)

The following decisions MUST be explicitly documented in the README with rationale and tradeoffs:

| Decision | Options Considered | Chosen | Rationale |
|---|---|---|---|
| IaC Tool | AWS CDK, AWS Blocks, Terraform, CloudFormation | AWS Blocks | Higher abstraction on CDK, faster to get started, good learning exercise |
| CI/CD Platform | GitHub Actions, GitLab CI, CodePipeline | GitHub Actions + CodeBuild runner | Combines GitHub Actions workflow familiarity with CodeBuild's AWS-native execution |
| Compute | Lambda, ECS Fargate, EC2, Elastic Beanstalk | AWS Lambda | Serverless, no infrastructure to manage, free tier generous, fits API use case |
| API Exposure | API Gateway REST, HTTP API, ALB | TBD during design | Document in README |
| Auth for CI/CD AWS access | IAM User keys, OIDC | OIDC | No long-lived credentials, best practice |
| Branching Strategy | Trunk-based, GitFlow, Feature→dev→main | Feature → dev → main | Simple two-env promotion model |

---

## Out of Scope

- No database or persistent storage (Lambda is stateless)
- No custom domain / Route53 DNS
- No container-based deployment (Lambda zip artifact only)
- No Terraform runnable code (comparison is documentation-only)
- No multi-region deployment
- No load testing or performance testing

---

## Acceptance Criteria

- [ ] AWS Blocks IaC code successfully provisions Lambda + API Gateway in both dev and prod AWS accounts/environments
- [ ] GitHub Actions workflow triggers correctly on PR to `dev` (CI) and merge to `main` (CD)
- [ ] CodeBuild is confirmed as the runner executing GitHub Actions jobs
- [ ] Python API deployed to Lambda returns correct responses from at least 2 endpoints
- [ ] Unit tests pass in the CI pipeline
- [ ] README contains architecture diagram, pipeline config, IaC comparison table, and setup instructions
- [ ] No hardcoded AWS credentials anywhere in the repository
- [ ] OIDC-based AWS authentication used in GitHub Actions
