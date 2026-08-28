# Infrastructure Design — Unit: pipeline

## AWS Resources (PipelineStack)

| Resource | AWS Service | CDK Construct | Notes |
|---|---|---|---|
| OIDC Provider | IAM OIDC Identity Provider | `iam.OpenIdConnectProvider` | Registers GitHub Actions OIDC IdP — created once per account |
| Deploy IAM Role | AWS IAM Role | `iam.Role` | Assumed by GitHub Actions via OIDC; scoped to specific repo |
| CodeBuild Project | AWS CodeBuild | `codebuild.Project` | GitHub Actions self-hosted runner |
| CodeBuild IAM Role | AWS IAM Role | `iam.Role` | Service role for CodeBuild project |

## Deployment Architecture

```
GitHub Repository
      |
      | OIDC JWT (short-lived)
      v
GitHub OIDC Provider (token.actions.githubusercontent.com)
      |
      | sts:AssumeRoleWithWebIdentity
      v
GitHubActionsDeployRole (IAM)
      |  scoped to repo:{owner}/{repo}:*
      |  permissions: sts:AssumeRole on cdk-* roles
      v
CDK Bootstrap Roles (iam::ACCOUNT:role/cdk-cfn-exec-role-*)
      |
      v
CloudFormation (deploys AppStack-dev / AppStack-prod)


GitHub Actions job → runs-on: codebuild-<project>-<run_id>-<attempt>
      |
      v
CodeBuild Project (flask-lambda-api-runner)
      |  service role with build permissions
      v
Build environment: Amazon Linux 2023
  - Node 18, Python 3.11, CDK CLI, git
```

## PipelineStack File Location

`PipelineStack` lives alongside `AppStack` in the `infra/` directory:

```
infra/
├── app.ts                      ← instantiates AppStack + PipelineStack
├── stacks/
│   ├── app-stack.ts            ← application infrastructure
│   └── pipeline-stack.ts       ← CI/CD infrastructure (NEW)
```

`app.ts` conditionally instantiates `PipelineStack` when `envName=pipeline` context is passed, keeping it separate from regular app deploys.

## GitHub Actions Workflow Files

```
.github/
└── workflows/
    ├── ci.yml        ← PR to dev: test + deploy-dev
    ├── cd.yml        ← push to main: deploy-prod
    └── deploy.yml    ← reusable: checkout, setup, OIDC, cdk deploy
```

## Bootstrap Sequence

```
1. Create GitHub repo with dev + main branches
2. npx cdk bootstrap aws://ACCOUNT/REGION  (if not done)
3. npx cdk deploy PipelineStack --context envName=pipeline
4. Note outputs: DeployRoleArn, CodeBuildProjectName
5. Set GitHub Actions variables:
      AWS_ROLE_ARN = <DeployRoleArn>
      AWS_REGION   = us-east-1
6. Connect CodeBuild to GitHub repo (one-time OAuth or GitHub App)
7. Push .github/workflows/ to repo
8. Open first PR to dev → pipeline activates
```
