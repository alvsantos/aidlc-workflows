# Code Summary — Unit: pipeline

## Generated Files

| File | Purpose | Stories |
|---|---|---|
| `infra/stacks/pipeline-stack.ts` | CDK PipelineStack: OIDC provider, GitHubActionsDeployRole, CodeBuild runner | S-12, S-13 |
| `infra/app.ts` | Updated: conditionally instantiates PipelineStack when envName=pipeline | S-12, S-13 |
| `.github/workflows/deploy.yml` | Reusable workflow: checkout, setup, OIDC, `cdk deploy` | S-10, S-11, S-12, S-13 |
| `.github/workflows/ci.yml` | CI: PR to dev → lint + pytest + cdk synth + deploy-dev | S-10 |
| `.github/workflows/cd.yml` | CD: push to main → deploy-prod | S-11 |

## Security Compliance (Code Generation stage)

| Rule | Status | Implementation |
|---|---|---|
| SECURITY-06 (Least-privilege IAM) | ✅ | `GitHubActionsDeployRole` only has `sts:AssumeRole` on `cdk-*` roles; no wildcard resources |
| SECURITY-10 (Dependency pinning) | ✅ | `npm ci` in all pipeline steps; action versions pinned |
| SECURITY-12 (OIDC, no stored keys) | ✅ | `aws-actions/configure-aws-credentials@v4` with `role-to-assume`; `id-token: write` permission |
| SECURITY-03 (No secrets in logs) | ✅ | No `echo $AWS_*`; `configure-aws-credentials` masks credentials automatically |
| Others | N/A | Not applicable to pipeline unit |

## Business Rules Compliance

| Rule | Status |
|---|---|
| BR-PIPE-01: No stored AWS keys | ✅ OIDC only |
| BR-PIPE-02: Trust policy scoped to repo | ✅ `StringLike sub: repo:{owner}/{repo}:*` |
| BR-PIPE-03: CI gates before deploy-dev | ✅ `needs: test` on deploy-dev job |
| BR-PIPE-04: CD only from main | ✅ `branches: [main]` trigger |
| BR-PIPE-05: npm ci | ✅ All workflow steps use `npm ci` |
| BR-PIPE-06: Least-privilege permissions | ✅ `id-token: write` + `contents: read` only |
| BR-PIPE-07: PipelineStack bootstrap-only | ✅ Not in ci.yml/cd.yml; separate context=pipeline |
| BR-PIPE-08: CodeBuild label format | ✅ `codebuild-flask-lambda-api-runner-${{ github.run_id }}-${{ github.run_attempt }}` |

## Bootstrap Commands

```bash
# 1. Deploy PipelineStack (once)
cd infra
npm ci
npx cdk deploy PipelineStack \
  --context envName=pipeline \
  --context githubRepo=YOUR_ORG/YOUR_REPO

# 2. Note outputs and set GitHub Actions variables:
#    AWS_ROLE_ARN   = <DeployRoleArn output>
#    AWS_REGION     = us-east-1

# 3. Connect CodeBuild to GitHub (one-time in AWS Console):
#    CodeBuild → Project flask-lambda-api-runner → Edit Source → Connect GitHub
```
