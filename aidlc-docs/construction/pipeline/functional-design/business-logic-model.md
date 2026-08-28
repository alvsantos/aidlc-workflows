# Business Logic Model — Unit: pipeline

## Overview

The `pipeline` unit has two parts:
1. **PipelineStack** — a CDK stack deployed once as a bootstrap step, provisioning the CodeBuild runner, OIDC provider, and IAM role
2. **GitHub Actions workflows** — YAML files triggering CI (PR to `dev`) and CD (merge to `main`), both using a shared reusable `deploy.yml`

---

## Part 1: PipelineStack (CDK TypeScript — one-time bootstrap)

### Construction Flow

```
npx cdk deploy PipelineStack (once)
      |
      ├── GitHubOidcProvider
      |     └── Registers token.actions.githubusercontent.com as trusted IdP
      |
      ├── GitHubActionsDeployRole
      |     └── OIDC trust policy scoped to specific GitHub repo
      |     └── Inline policy: sts:AssumeRole on CDK bootstrap roles
      |
      └── CodeBuildRunnerProject
            └── GitHub Actions self-hosted runner for the repo
            └── IAM service role with CDK deploy permissions
```

### Outputs
- `DeployRoleArn` → used as `AWS_ROLE_ARN` GitHub Actions variable
- `CodeBuildProjectName` → used to configure GitHub Actions runner

---

## Part 2: GitHub Actions Workflows

### Workflow Trigger Model

```
Feature branch
      |
      | git push feature/xyz
      |
      v
PR opened → dev branch
      |
      v
ci.yml (triggered: pull_request targeting dev)
      |
      ├── Job: test
      |     ├── flake8 app/
      |     ├── pytest app/tests/
      |     └── npx cdk synth --context envName=dev
      |
      └── Job: deploy-dev (needs: test)
            └── calls .github/workflows/deploy.yml
                  with: environment=dev, stack-name=AppStack-dev

      |
      | PR merged → dev
      |
      v
Merge dev → main
      |
      v
cd.yml (triggered: push to main)
      |
      └── Job: deploy-prod
            └── calls .github/workflows/deploy.yml
                  with: environment=prod, stack-name=AppStack-prod
```

### Reusable Deploy Workflow (`deploy.yml`)

```
Inputs: environment, stack-name, aws-region (default: us-east-1)

Steps:
  1. actions/checkout@v4
  2. actions/setup-node@v4  (Node 18)
  3. actions/setup-python@v5  (Python 3.11)
  4. Install app deps: pip install -r app/requirements-dev.txt
  5. Install infra deps: npm ci (in infra/)
  6. aws-actions/configure-aws-credentials@v4 (OIDC — no stored keys)
  7. npx cdk deploy <stack-name> --context envName=<environment> --require-approval never
```

---

## CodeBuild as GitHub Actions Runner

GitHub Actions supports [CodeBuild as a hosted runner](https://docs.aws.amazon.com/codebuild/latest/userguide/action-runner.html). When configured:

- GitHub Actions job specifies `runs-on: codebuild-<project-name>-${{ github.run_id }}-${{ github.run_attempt }}`
- GitHub spins up a CodeBuild build for the job
- CodeBuild executes the steps using its IAM service role
- Results are reported back to GitHub Actions

This means GitHub Actions orchestrates the workflow logic while CodeBuild provides the execution environment and IAM identity for AWS API calls.
