# Code Generation Plan — Unit: pipeline

## Unit Context
- **Unit**: pipeline (GitHub Actions + CodeBuild + CDK PipelineStack)
- **Stories**: S-10, S-11, S-12, S-13
- **Target directories**: `.github/workflows/` (workflows), `infra/stacks/pipeline-stack.ts` (CDK)
- **Dependencies**: `infra/stacks/app-stack.ts` must exist (PipelineStack shares infra/ directory)

---

## Step 1: PipelineStack CDK — `infra/stacks/pipeline-stack.ts`
- [x] Define `PipelineStackProps` with `githubRepo: string` (format: `owner/repo`)
- [x] `_createOidcProvider()` — IAM OIDC provider for GitHub Actions (S-12)
- [x] `_createDeployRole(provider)` — `GitHubActionsDeployRole` with scoped OIDC trust policy (S-12, BR-PIPE-01/02)
- [x] `_createCodeBuildRole()` — CodeBuild service role with CDK deploy permissions (S-13)
- [x] `_createCodeBuildProject(role)` — CodeBuild project as GitHub Actions runner (S-13)
- [x] `_createOutputs()` — `DeployRoleArn`, `CodeBuildProjectName`

## Step 2: Update `infra/app.ts` — add PipelineStack instantiation
- [x] Add conditional: if `envName === "pipeline"`, instantiate `PipelineStack`
- [x] Pass `githubRepo` from CDK context

## Step 3: Reusable Deploy Workflow — `.github/workflows/deploy.yml`
- [x] `on: workflow_call` with inputs: `environment`, `stack-name`, `aws-region`
- [x] `permissions: id-token: write, contents: read` (BR-PIPE-06)
- [x] Job runs-on: `codebuild-flask-lambda-api-runner-${{ github.run_id }}-${{ github.run_attempt }}` (BR-PIPE-08, S-13)
- [x] Step: `actions/checkout@v4`
- [x] Step: `actions/setup-node@v4` (Node 18)
- [x] Step: `actions/setup-python@v5` (Python 3.11)
- [x] Step: Install app dev deps (`pip install -r app/requirements-dev.txt`)
- [x] Step: Install infra deps (`npm ci` in `infra/`) (BR-PIPE-05)
- [x] Step: `aws-actions/configure-aws-credentials@v4` with OIDC (BR-PIPE-01, S-12)
- [x] Step: `npx cdk deploy <stack-name> --context envName=<environment>` (S-10, S-11)

## Step 4: CI Workflow — `.github/workflows/ci.yml`
- [x] `on: pull_request` targeting `dev` branch
- [x] `permissions: id-token: write, contents: read` (BR-PIPE-06)
- [x] Job: `test` — runs flake8, pytest, cdk synth (S-10, BR-PIPE-03)
- [x] Job: `deploy-dev` with `needs: test` — calls `deploy.yml` with `environment: dev` (S-10, BR-PIPE-03)

## Step 5: CD Workflow — `.github/workflows/cd.yml`
- [x] `on: push` to `main` branch (BR-PIPE-04, S-11)
- [x] `permissions: id-token: write, contents: read`
- [x] Job: `deploy-prod` — calls `deploy.yml` with `environment: prod` (S-11)

## Step 6: Summary doc
- [x] Create `aidlc-docs/construction/pipeline/code/pipeline-summary.md`

---

## Story Traceability
| Story | Step |
|---|---|
| S-10: CI workflow (PR to dev) | Steps 3, 4 |
| S-11: CD workflow (merge to main) | Steps 3, 5 |
| S-12: OIDC auth | Steps 1, 3 |
| S-13: CodeBuild runner | Steps 1, 3 |
