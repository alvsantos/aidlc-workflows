# NFR Design Patterns — Unit: pipeline

## Pattern 1: OIDC Role Assumption (SECURITY-12, BR-PIPE-01)

GitHub Actions requests a short-lived JWT from GitHub's OIDC provider, then exchanges it for AWS credentials via `sts:AssumeRoleWithWebIdentity`.

```yaml
# In every job that needs AWS access
permissions:
  id-token: write   # Allows the job to request OIDC token
  contents: read    # Needed for actions/checkout

steps:
  - name: Configure AWS credentials via OIDC
    uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: ${{ vars.AWS_ROLE_ARN }}
      aws-region: ${{ vars.AWS_REGION }}
      role-session-name: GitHubActions-${{ github.run_id }}
```

No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` secrets anywhere.

---

## Pattern 2: Reusable Workflow with Inputs (DRY)

`deploy.yml` is called by both `ci.yml` (environment=dev) and `cd.yml` (environment=prod):

```yaml
# .github/workflows/deploy.yml
on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      stack-name:
        required: true
        type: string
      aws-region:
        required: false
        type: string
        default: "us-east-1"
    secrets:
      aws-role-arn:
        required: true
```

Calling from ci.yml:
```yaml
deploy-dev:
  needs: test
  uses: ./.github/workflows/deploy.yml
  with:
    environment: dev
    stack-name: AppStack-dev
  secrets:
    aws-role-arn: ${{ secrets.AWS_ROLE_ARN }}
```

---

## Pattern 3: CodeBuild Runner Label (BR-PIPE-08)

```yaml
jobs:
  test:
    runs-on: codebuild-flask-lambda-api-runner-${{ github.run_id }}-${{ github.run_attempt }}
```

The label format `codebuild-<project-name>-<run_id>-<run_attempt>` is required by AWS CodeBuild for runner routing.

---

## Pattern 4: Pinned Action Versions (SECURITY-10)

All `uses:` references pin to exact versions:

```yaml
- uses: actions/checkout@v4          # pinned major version
- uses: actions/setup-node@v4        # pinned major version
- uses: actions/setup-python@v5      # pinned major version
- uses: aws-actions/configure-aws-credentials@v4  # pinned major version
```

For production-grade security, these should be pinned to commit SHAs. For this demo, major version pinning is acceptable.

---

## Pattern 5: Scoped OIDC Trust Policy (SECURITY-06, BR-PIPE-02)

The IAM role trust policy restricts which GitHub repos can assume it:

```typescript
// In PipelineStack._createDeployRole()
new iam.Role(this, "GitHubActionsDeployRole", {
  assumedBy: new iam.WebIdentityPrincipal(
    oidcProvider.openIdConnectProviderArn,
    {
      StringLike: {
        "token.actions.githubusercontent.com:sub":
          `repo:${githubRepo}:*`,
      },
      StringEquals: {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      },
    }
  ),
  // ...
});
```
