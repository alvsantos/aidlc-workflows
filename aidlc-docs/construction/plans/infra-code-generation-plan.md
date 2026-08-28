# Code Generation Plan — Unit: infra

## Unit Context
- **Unit**: infra (AWS Blocks / CDK TypeScript)
- **Stories**: S-06, S-07, S-08, S-09
- **Target directory**: `infra/` (workspace root — never aidlc-docs/)
- **Tech stack**: TypeScript, AWS CDK v2, AWS Blocks, Node.js 18+
- **Deploy command**: `npx cdk deploy AppStack-{envName} --context envName={envName}`
- **Dependencies**: `app/` must exist (Lambda asset bundling)

---

## Step 1: Project Structure Setup
- [x] Create `infra/` directory
- [x] Create `infra/stacks/` directory

## Step 2: TypeScript + CDK Configuration
- [x] Create `infra/package.json` (pinned exact versions, no `^` or `~`)
- [x] Create `infra/tsconfig.json` (TypeScript compiler config for CDK)
- [x] Create `infra/cdk.json` (CDK app config + local dev context defaults)

## Step 3: AppStack Generation — `infra/stacks/app-stack.ts`
- [x] Import CDK constructs (lambda, apigwv2, iam, logs, cdk)
- [x] Define `AppStackProps` interface with `envName: string`
- [x] Implement `resolveConfig(envName)` — all env differences in one place
- [x] Implement `AppStack` class extending `cdk.Stack`
- [x] `_createLogGroups(config)` — Lambda log group + API GW log group with retention + removal policy (S-09)
- [x] `_createExecutionRole()` — IAM role with `AWSLambdaBasicExecutionRole` only (S-08)
- [x] `_createLambdaFunction(role, logGroup, config)` — Lambda function with asset bundling (S-06, S-07)
- [x] `_createHttpApi(fn, accessLogGroup, config)` — HTTP API + Lambda integration + access logging (S-06, S-07)
- [x] `_createOutputs(api, fn)` — CloudFormation outputs: ApiUrl, LambdaFunctionArn, EnvironmentName

## Step 4: CDK App Entry Point — `infra/app.ts`
- [x] Create CDK App instance
- [x] Read `envName` from context with fail-fast validation
- [x] Instantiate `AppStack` with `envName` prop

## Step 5: Documentation
- [x] Create `infra/README.md` — setup, deploy commands, bootstrap instructions

## Step 6: Code Summary
- [x] Create `aidlc-docs/construction/infra/code/infra-summary.md`

---

## Story Traceability
| Story | Step |
|---|---|
| S-06: AppStack-dev deployment | Steps 3, 4 |
| S-07: AppStack-prod deployment | Steps 3, 4 (same code, different context) |
| S-08: Least-privilege IAM role | Step 3 (`_createExecutionRole`) |
| S-09: CloudWatch log retention | Step 3 (`_createLogGroups`) |
