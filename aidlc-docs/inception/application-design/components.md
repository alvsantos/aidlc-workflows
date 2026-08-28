# Components

## Unit: app (Python REST API)

### Component: ApiHandler
- **Purpose**: Entry point for all Lambda invocations. Routes API Gateway events to the correct handler function using AWS Lambda Powertools `ApiGatewayResolver`.
- **Responsibilities**:
  - Receive raw Lambda event and context objects
  - Route HTTP method + path to the appropriate handler function
  - Return properly formatted API Gateway proxy response
  - Emit structured logs via Powertools Logger
- **Type**: Application — Lambda handler

---

### Component: HealthController
- **Purpose**: Handles `GET /health` requests. Returns service liveness status.
- **Responsibilities**:
  - Return `{"status": "ok"}` with HTTP 200
  - Include environment name in response (from Lambda env var)
- **Type**: Application — Route handler

---

### Component: HelloController
- **Purpose**: Handles `GET /hello/{name}` requests. Returns a personalized greeting.
- **Responsibilities**:
  - Accept `name` path parameter
  - Validate that `name` is non-empty and safe (no script injection)
  - Return `{"message": "Hello, {name}!"}` with HTTP 200
- **Type**: Application — Route handler

---

### Component: VersionController
- **Purpose**: Handles `GET /version` requests. Returns runtime environment metadata.
- **Responsibilities**:
  - Return app version (from env var `APP_VERSION`), environment name (`ENV`), and Python runtime version
  - HTTP 200
- **Type**: Application — Route handler

---

### Component: PowertoolsConfig
- **Purpose**: Centralized configuration for AWS Lambda Powertools utilities.
- **Responsibilities**:
  - Configure `Logger` with service name, log level, and structured JSON output
  - Configure `Tracer` (X-Ray) if enabled
  - Export shared `logger` and `app` (ApiGatewayResolver) instances for use across controllers
- **Type**: Application — Configuration/shared utilities

---

## Unit: infra (AWS Blocks / CDK)

### Component: AppStack
- **Purpose**: Single CDK stack that provisions all application infrastructure for one environment.
- **Responsibilities**:
  - Accept `envName` prop (`dev` | `prod`) to drive environment-specific configuration
  - Instantiate and wire Lambda function, API Gateway HTTP API, IAM execution role, CloudWatch Log Group
  - Export stack outputs: `ApiUrl`, `LambdaFunctionArn`
- **Type**: Infrastructure — CDK Stack

---

### Component: LambdaFunction (within AppStack)
- **Purpose**: AWS Lambda function resource definition.
- **Responsibilities**:
  - Define Python 3.11 runtime
  - Point to `app/` as the code asset (bundled zip)
  - Set environment variables: `ENV`, `APP_VERSION`, `LOG_LEVEL`
  - Reference IAM execution role
  - Configure CloudWatch Log Group with environment-specific retention (dev: 7 days, prod: 30 days)
- **Type**: Infrastructure — CDK Construct

---

### Component: ApiGatewayHttpApi (within AppStack)
- **Purpose**: Amazon API Gateway HTTP API resource definition.
- **Responsibilities**:
  - Create HTTP API with Lambda proxy integration
  - Define stage name matching environment (`dev` | `prod`)
  - Enable access logging to CloudWatch
  - Configure CORS if needed
- **Type**: Infrastructure — CDK Construct

---

### Component: LambdaExecutionRole (within AppStack)
- **Purpose**: IAM role assumed by the Lambda function at runtime.
- **Responsibilities**:
  - Trust policy: `lambda.amazonaws.com` service principal only
  - Managed policy: `AWSLambdaBasicExecutionRole` (CloudWatch Logs write)
  - No additional permissions (stateless API — no S3, DynamoDB, etc.)
- **Type**: Infrastructure — CDK IAM Construct

---

## Unit: pipeline (GitHub Actions + CodeBuild)

### Component: PipelineStack
- **Purpose**: Separate CDK stack that provisions CI/CD infrastructure.
- **Responsibilities**:
  - Provision CodeBuild project configured as a GitHub Actions self-hosted runner
  - Provision OIDC Identity Provider for GitHub Actions
  - Provision IAM role for GitHub Actions OIDC (`GitHubActionsDeployRole`) with CDK deploy permissions
  - Export CodeBuild project name
- **Type**: Infrastructure — CDK Stack

---

### Component: CodeBuildRunnerProject (within PipelineStack)
- **Purpose**: AWS CodeBuild project used as the compute runner for GitHub Actions jobs.
- **Responsibilities**:
  - Use `aws/codebuild/standard:7.0` build image (Amazon Linux 2023)
  - Configure environment: Node.js 18, Python 3.11, CDK CLI
  - IAM service role with permission to deploy CDK stacks (dev + prod)
  - Connected to GitHub repository via GitHub App or OAuth
- **Type**: Infrastructure — CDK Construct

---

### Component: GitHubOidcProvider (within PipelineStack)
- **Purpose**: IAM OIDC Identity Provider that trusts GitHub Actions tokens.
- **Responsibilities**:
  - Register `token.actions.githubusercontent.com` as a trusted OIDC provider
  - Used by `GitHubActionsDeployRole` trust policy
- **Type**: Infrastructure — CDK IAM Construct

---

### Component: GitHubActionsDeployRole (within PipelineStack)
- **Purpose**: IAM role assumed by GitHub Actions via OIDC during pipeline runs.
- **Responsibilities**:
  - Trust policy: allow `sts:AssumeRoleWithWebIdentity` from OIDC provider, scoped to the specific GitHub repo
  - Permissions: `sts:AssumeRole` on CDK bootstrap execution role + lookup role (to allow `cdk deploy`)
- **Type**: Infrastructure — CDK IAM Construct

---

### Component: ReusableDeployWorkflow
- **Purpose**: GitHub Actions reusable workflow (`deploy.yml`) called by both CI and CD workflows.
- **Responsibilities**:
  - Accept inputs: `environment` (`dev` | `prod`), `stack-name`
  - Checkout code, set up Node.js + Python, install dependencies
  - Assume AWS role via OIDC (`aws-actions/configure-aws-credentials`)
  - Run `cdk deploy` for the specified stack
- **Type**: Pipeline — GitHub Actions reusable workflow

---

### Component: CiWorkflow
- **Purpose**: GitHub Actions workflow triggered on PR to `dev` branch.
- **Responsibilities**:
  - Trigger: `pull_request` targeting `dev`
  - Run linting (`flake8`)
  - Run unit tests (`pytest`)
  - Run `cdk synth` (IaC validation)
  - Call `ReusableDeployWorkflow` with `environment: dev`
- **Type**: Pipeline — GitHub Actions workflow

---

### Component: CdWorkflow
- **Purpose**: GitHub Actions workflow triggered on merge to `main` branch.
- **Responsibilities**:
  - Trigger: `push` to `main`
  - Call `ReusableDeployWorkflow` with `environment: prod`
- **Type**: Pipeline — GitHub Actions workflow
