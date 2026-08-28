# Component Methods

## Unit: app (Python REST API)

### ApiHandler

| Method | Signature | Purpose |
|---|---|---|
| `handler` | `handler(event: dict, context: LambdaContext) -> dict` | Lambda entry point. Delegates to `app.resolve(event, context)` via Powertools ApiGatewayResolver |

---

### HealthController

| Method | Signature | Purpose |
|---|---|---|
| `get_health` | `get_health() -> dict` | Returns `{"status": "ok", "environment": str}`. Registered on `GET /health` |

---

### HelloController

| Method | Signature | Purpose |
|---|---|---|
| `get_hello` | `get_hello(name: str) -> dict` | Validates `name` path param (non-empty, alphanumeric + spaces, max 50 chars). Returns `{"message": "Hello, {name}!"}`. Registered on `GET /hello/{name}` |

**Business Rules:**
- `name` must be 1–50 characters
- `name` must match `^[a-zA-Z0-9 _-]+$` — no HTML/script characters
- If validation fails: HTTP 400 with `{"error": "Invalid name parameter"}`

---

### VersionController

| Method | Signature | Purpose |
|---|---|---|
| `get_version` | `get_version() -> dict` | Returns `{"version": str, "environment": str, "python_version": str}` from env vars and `sys.version`. Registered on `GET /version` |

---

### PowertoolsConfig

| Method / Symbol | Type | Purpose |
|---|---|---|
| `logger` | `Logger` instance | Shared Powertools Logger — service=`flask-lambda-api`, JSON structured output |
| `app` | `ApiGatewayResolver` instance | Shared resolver used by all controllers to register routes |
| `tracer` | `Tracer` instance | X-Ray tracer — disabled in dev via `POWERTOOLS_TRACE_DISABLED=true` |

---

## Unit: infra (AWS Blocks / CDK)

### AppStack

| Method | Signature | Purpose |
|---|---|---|
| `__init__` | `__init__(scope, id, env_name: str, **kwargs)` | Constructor. Instantiates all constructs (Lambda, API GW, IAM, LogGroup). Calls `_create_lambda()`, `_create_api()`, `_create_outputs()` |
| `_create_lambda` | `_create_lambda() -> lambda_.Function` | Creates Lambda function with Python 3.11 runtime, code asset from `../app`, env vars, execution role, and log group |
| `_create_api` | `_create_api(fn: lambda_.Function) -> apigwv2.HttpApi` | Creates HTTP API with Lambda proxy integration and access logging |
| `_create_outputs` | `_create_outputs(api: apigwv2.HttpApi, fn: lambda_.Function)` | Emits CloudFormation outputs: `ApiUrl`, `LambdaFunctionArn`, `EnvironmentName` |

---

### LambdaExecutionRole (inline within AppStack._create_lambda)

| Property | Value | Purpose |
|---|---|---|
| `assumed_by` | `ServicePrincipal("lambda.amazonaws.com")` | Trust policy scoped to Lambda service only |
| `managed_policies` | `[AWSLambdaBasicExecutionRole]` | Grants CloudWatch Logs write permission |

---

## Unit: pipeline (GitHub Actions + CodeBuild)

### PipelineStack

| Method | Signature | Purpose |
|---|---|---|
| `__init__` | `__init__(scope, id, github_repo: str, **kwargs)` | Constructor. Instantiates OIDC provider, IAM role, CodeBuild project |
| `_create_oidc_provider` | `_create_oidc_provider() -> iam.OpenIdConnectProvider` | Registers `token.actions.githubusercontent.com` as trusted OIDC IdP |
| `_create_deploy_role` | `_create_deploy_role(provider) -> iam.Role` | Creates `GitHubActionsDeployRole` with OIDC trust scoped to the GitHub repo |
| `_create_codebuild_project` | `_create_codebuild_project() -> codebuild.Project` | Creates CodeBuild project as GitHub Actions runner |

---

### GitHubActionsDeployRole (inline within PipelineStack._create_deploy_role)

| Property | Value | Purpose |
|---|---|---|
| `assume_role_action` | `sts:AssumeRoleWithWebIdentity` | OIDC assumption — no static credentials |
| `conditions` | `StringLike: token.actions.githubusercontent.com:sub: repo:{owner}/{repo}:*` | Scopes trust to specific GitHub repo only |
| `inline_policies` | `sts:AssumeRole` on `arn:aws:iam::*:role/cdk-*` | Allows CDK to assume bootstrap roles for deploy |

---

### ReusableDeployWorkflow (.github/workflows/deploy.yml)

| Input | Type | Purpose |
|---|---|---|
| `environment` | `string` (required) | `dev` or `prod` — controls which CDK stack is deployed |
| `stack-name` | `string` (required) | CDK stack identifier (e.g., `AppStack-dev`) |
| `aws-role-arn` | `string` (required) | IAM role ARN to assume via OIDC |
| `aws-region` | `string` (default: `us-east-1`) | Target AWS region |

| Step | Action | Purpose |
|---|---|---|
| `checkout` | `actions/checkout@v4` | Fetch source |
| `setup-node` | `actions/setup-node@v4` (Node 18) | CDK CLI prerequisite |
| `setup-python` | `actions/setup-python@v5` (Python 3.11) | App dependencies |
| `configure-aws` | `aws-actions/configure-aws-credentials@v4` | Assume IAM role via OIDC |
| `install-deps` | `pip install` + `npm ci` | Install app + IaC deps |
| `cdk-deploy` | `npx cdk deploy ${{ inputs.stack-name }}` | Deploy CDK stack |

---

### CiWorkflow (.github/workflows/ci.yml)

| Step | Purpose |
|---|---|
| Trigger on `pull_request` → `dev` | Activates on every PR targeting dev |
| `flake8 app/` | Lint Python code |
| `pytest app/tests/` | Run unit tests |
| `npx cdk synth` | Validate IaC compiles to valid CloudFormation |
| Call `deploy.yml` with `environment: dev` | Deploy to dev environment |

---

### CdWorkflow (.github/workflows/cd.yml)

| Step | Purpose |
|---|---|
| Trigger on `push` → `main` | Activates on merge to main |
| Call `deploy.yml` with `environment: prod` | Deploy to prod environment |
