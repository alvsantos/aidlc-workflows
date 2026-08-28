# Business Rules — Unit: pipeline

## BR-PIPE-01: No AWS credentials stored as GitHub secrets

**Rule**: All AWS API calls in GitHub Actions MUST use OIDC (`id-token: write` permission + `aws-actions/configure-aws-credentials` with `role-to-assume`). No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` secrets may be stored in GitHub.
**Rationale**: Long-lived credentials are a security risk — rotation is manual and they can leak. OIDC credentials are short-lived and scoped per workflow run. (SECURITY-12, NFR-01)

## BR-PIPE-02: OIDC trust policy scoped to specific repo

**Rule**: The `GitHubActionsDeployRole` trust policy MUST include a `StringLike` condition on the `sub` claim scoped to `repo:{owner}/{repo}:*`. A wildcard trust (`token.actions.githubusercontent.com` alone without sub condition) is NOT acceptable.
**Rationale**: Without the sub condition, any GitHub Actions workflow on any repo could assume the role. (SECURITY-06, SECURITY-12)

## BR-PIPE-03: CI must pass before deploy to dev

**Rule**: The deploy-dev job MUST declare `needs: test` in ci.yml — deploy only runs if lint + unit tests + cdk synth all pass.
**Rationale**: Prevents deploying broken code to the dev environment.

## BR-PIPE-04: CD deploys to prod only on main branch

**Rule**: The cd.yml workflow MUST use `branches: [main]` trigger. No other branch triggers a prod deployment.
**Rationale**: Only code merged to `main` (from `dev`) should reach production.

## BR-PIPE-05: npm ci in pipeline, not npm install

**Rule**: CI/CD workflows MUST use `npm ci` (not `npm install`) in `infra/`.
**Rationale**: `npm ci` uses `package-lock.json` exactly — reproducible, no accidental upgrades. (SECURITY-10)

## BR-PIPE-06: Workflow permissions follow least-privilege

**Rule**: Each workflow MUST declare only the permissions it needs. The minimum for OIDC is:
```yaml
permissions:
  id-token: write   # required for OIDC
  contents: read    # required for checkout
```
No `permissions: write-all` or blanket permissions.

## BR-PIPE-07: PipelineStack deployed once, not by the pipeline

**Rule**: `PipelineStack` is a bootstrap resource — it MUST be deployed manually before the GitHub Actions pipeline is configured. It is NOT deployed by ci.yml or cd.yml.
**Rationale**: The pipeline needs the CodeBuild project and IAM role to exist before it can run.

## BR-PIPE-08: CodeBuild runner label format

**Rule**: The `runs-on` label for CodeBuild runner MUST follow the format:
`codebuild-<project-name>-${{ github.run_id }}-${{ github.run_attempt }}`
This is the required format per AWS CodeBuild GitHub Actions runner documentation.
