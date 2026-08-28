# Services

Services represent the orchestration layer — how components coordinate to fulfil a request or business operation.

---

## Service: ApiRoutingService

**Unit**: app
**Purpose**: Orchestrates routing of API Gateway HTTP events to the correct controller using Powertools `ApiGatewayResolver`.

**How it works**:
1. Lambda receives an API Gateway proxy event via `handler(event, context)`
2. `ApiGatewayResolver` matches the HTTP method + path against registered routes
3. The matching controller method is invoked
4. The controller returns a dict; Powertools serialises it into an API Gateway proxy response
5. Structured log entry is emitted per request (request ID, path, method, status code)

**Components involved**: `ApiHandler` → `ApiGatewayResolver` (Powertools) → `HealthController` | `HelloController` | `VersionController`

**Error handling**:
- Unmatched route → HTTP 404 (Powertools default)
- Unhandled exception → HTTP 500 with generic `{"error": "Internal server error"}` — no stack trace exposed to caller (SECURITY-15)
- Validation failure in controller → HTTP 400 with specific error message

---

## Service: InfraProvisioningService

**Unit**: infra
**Purpose**: Orchestrates the synthesis and deployment of all AWS resources for one environment via CDK.

**How it works**:
1. `cdk deploy AppStack-{env}` is invoked (by pipeline or locally)
2. CDK resolves context key `envName` from `cdk.json` or `--context` flag
3. `AppStack` constructor runs — creates Lambda function, API Gateway HTTP API, IAM role, CloudWatch Log Group
4. CDK synthesises to a CloudFormation template
5. CloudFormation deploys the changeset
6. Stack outputs (`ApiUrl`, `LambdaFunctionArn`) are written to CloudFormation exports

**Components involved**: `AppStack` → `LambdaFunction` + `ApiGatewayHttpApi` + `LambdaExecutionRole`

**Environment differences (dev vs prod)**:

| Resource | dev | prod |
|---|---|---|
| Log retention | 7 days | 30 days |
| Lambda memory | 128 MB | 256 MB |
| Stack name | `AppStack-dev` | `AppStack-prod` |
| API GW stage | `dev` | `prod` |

---

## Service: PipelineProvisioningService

**Unit**: pipeline
**Purpose**: Orchestrates provisioning of CI/CD infrastructure (CodeBuild runner, OIDC provider, IAM role) as a separate CDK stack.

**How it works**:
1. `cdk deploy PipelineStack` is run once (bootstrap step, not in the regular pipeline)
2. `PipelineStack` creates the OIDC provider, `GitHubActionsDeployRole`, and CodeBuild project
3. The CodeBuild project ARN and IAM role ARN are exported as stack outputs
4. These values are used as GitHub Actions variables/secrets to configure the workflows

**Components involved**: `PipelineStack` → `GitHubOidcProvider` + `GitHubActionsDeployRole` + `CodeBuildRunnerProject`

**Note**: This stack is deployed **once** as a bootstrap step, not on every push. It is the prerequisite for the CI/CD pipeline to function.

---

## Service: CiPipelineService

**Unit**: pipeline
**Purpose**: Orchestrates the CI pipeline — runs quality gates and deploys to dev on every PR to `dev` branch.

**Workflow**:
```
PR opened/updated → dev
    └── CiWorkflow
          ├── lint (flake8)
          ├── unit tests (pytest)
          ├── IaC validation (cdk synth)
          └── call ReusableDeployWorkflow(environment=dev)
                └── cdk deploy AppStack-dev
```

**Components involved**: `CiWorkflow` → `ReusableDeployWorkflow` → `GitHubActionsDeployRole` (OIDC) → CDK → `AppStack-dev`

---

## Service: CdPipelineService

**Unit**: pipeline
**Purpose**: Orchestrates the CD pipeline — deploys to prod on every merge to `main`.

**Workflow**:
```
Push to main (merge from dev)
    └── CdWorkflow
          └── call ReusableDeployWorkflow(environment=prod)
                └── cdk deploy AppStack-prod
```

**Components involved**: `CdWorkflow` → `ReusableDeployWorkflow` → `GitHubActionsDeployRole` (OIDC) → CDK → `AppStack-prod`
