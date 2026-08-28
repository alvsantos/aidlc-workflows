# Unit of Work — Story Map

This maps functional requirements (from `requirements.md`) to the unit responsible for implementing them. Stories are derived from the requirements document.

---

## Story Map

| Story ID | Story | Unit | Component(s) | Acceptance Criteria |
|---|---|---|---|---|
| S-01 | As a developer, I want a `GET /health` endpoint so I can verify the API is running | `app` | `HealthController`, `ApiHandler` | Returns `{"status": "ok", "environment": "<env>"}` with HTTP 200 |
| S-02 | As a developer, I want a `GET /hello/{name}` endpoint with input validation | `app` | `HelloController`, `ApiHandler` | Returns greeting for valid name; HTTP 400 for invalid input (empty, >50 chars, special chars) |
| S-03 | As a developer, I want a `GET /version` endpoint that returns runtime metadata | `app` | `VersionController`, `ApiHandler` | Returns `{"version": str, "environment": str, "python_version": str}` with HTTP 200 |
| S-04 | As a developer, I want unit tests for all API endpoints | `app` | `app/tests/test_main.py` | pytest passes for all 3 endpoints; covers happy path + validation errors |
| S-05 | As an operator, I want structured JSON logs for every API request | `app` | `PowertoolsConfig`, `ApiHandler` | Every request emits a JSON log entry with request ID, path, method, status code |
| S-06 | As a developer, I want the API provisioned on AWS Lambda + API Gateway in dev | `infra` | `AppStack`, `LambdaFunction`, `ApiGatewayHttpApi` | `cdk deploy AppStack-dev` succeeds; API URL returns valid responses |
| S-07 | As a developer, I want the API provisioned in prod with tighter resource config | `infra` | `AppStack` (prod variant) | `cdk deploy AppStack-prod` succeeds; separate API URL from dev; 256 MB memory, 30-day logs |
| S-08 | As an operator, I want Lambda execution role with least-privilege IAM permissions | `infra` | `LambdaExecutionRole` | Role has only `AWSLambdaBasicExecutionRole`; no extra permissions |
| S-09 | As an operator, I want CloudWatch log groups with env-specific retention | `infra` | `LambdaFunction` (log group config) | dev: 7-day retention; prod: 30-day retention |
| S-10 | As a developer, I want CI pipeline running lint + tests + deploy to dev on every PR | `pipeline` | `CiWorkflow`, `ReusableDeployWorkflow` | PR to `dev` triggers: flake8 passes, pytest passes, cdk synth passes, AppStack-dev deploys |
| S-11 | As a developer, I want CD pipeline deploying to prod on merge to main | `pipeline` | `CdWorkflow`, `ReusableDeployWorkflow` | Merge to `main` triggers: AppStack-prod deploys successfully |
| S-12 | As a security engineer, I want AWS credentials in GitHub Actions via OIDC only | `pipeline` | `GitHubOidcProvider`, `GitHubActionsDeployRole` | No IAM access keys in repo; OIDC assume-role succeeds in pipeline; trust policy scoped to specific repo |
| S-13 | As a developer, I want CodeBuild as the GitHub Actions compute runner | `pipeline` | `CodeBuildRunnerProject`, `PipelineStack` | GitHub Actions jobs execute on CodeBuild infrastructure; confirmed in job logs |

---

## Stories by Unit

### Unit: app
- S-01: GET /health endpoint
- S-02: GET /hello/{name} endpoint with validation
- S-03: GET /version endpoint
- S-04: Unit tests (pytest)
- S-05: Structured logging

### Unit: infra
- S-06: AppStack-dev deployment
- S-07: AppStack-prod deployment
- S-08: Least-privilege IAM role
- S-09: CloudWatch log retention

### Unit: pipeline
- S-10: CI workflow (PR to dev)
- S-11: CD workflow (merge to main)
- S-12: OIDC authentication
- S-13: CodeBuild runner

---

## Requirement Traceability

| Requirement | Stories |
|---|---|
| FR-01 (IaC Infrastructure) | S-06, S-07, S-08, S-09 |
| FR-02 (Sample Application) | S-01, S-02, S-03, S-04, S-05 |
| FR-03 (CI/CD Pipeline) | S-10, S-11, S-13 |
| FR-04 (Branching Strategy) | S-10, S-11 |
| FR-05 (Two Environments) | S-06, S-07 |
| NFR-01 (Security) | S-08, S-12 |
| NFR-04 (Observability) | S-05, S-09 |
