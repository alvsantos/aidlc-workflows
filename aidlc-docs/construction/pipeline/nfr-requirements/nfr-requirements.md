# NFR Requirements — Unit: pipeline

## Security (SECURITY extension — enforced)

### SECURITY-06: Least-privilege IAM
- `GitHubActionsDeployRole` MUST only have `sts:AssumeRole` on CDK bootstrap roles (`arn:aws:iam::*:role/cdk-*`)
- CodeBuild service role MUST only have permissions needed to run builds and assume the deploy role
- No wildcard actions or resources in either policy

### SECURITY-07: Restrictive network config
- CodeBuild project runs in AWS-managed network (no custom VPC required)
- No inbound network rules needed — CodeBuild initiates outbound connections only

### SECURITY-12: Authentication and credential management
- OIDC federation MUST be used for all AWS API calls from GitHub Actions
- OIDC provider thumbprint MUST be set correctly for `token.actions.githubusercontent.com`
- Trust policy sub condition MUST be scoped to the specific GitHub org/repo (BR-PIPE-02)
- No IAM user access keys may be used

### SECURITY-10: Dependency pinning
- All GitHub Actions `uses:` references MUST pin to a specific commit SHA or exact version tag
- `npm ci` (not `npm install`) in all pipeline steps

### SECURITY-03: No secrets in logs
- `aws-actions/configure-aws-credentials` MUST NOT log credential values
- No `echo $AWS_*` in pipeline steps

---

## Reliability

| Requirement | Implementation |
|---|---|
| CI gates before deploy | `needs: test` on deploy-dev job |
| Prod deploy only from main | `branches: [main]` trigger on cd.yml |
| Idempotent deploy | `cdk deploy --require-approval never` — CloudFormation handles idempotency |
| Failed deploy visibility | GitHub Actions UI shows step-level failure; CloudFormation events available in AWS Console |

---

## Maintainability

| Requirement | Implementation |
|---|---|
| DRY workflows | Single `deploy.yml` reusable workflow called by both CI and CD |
| Well-commented YAML | Each workflow step has a `name:` field explaining its purpose |
| Environment variables | Centralised in workflow-level `env:` block or GitHub Actions variables |
