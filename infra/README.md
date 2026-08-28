# infra — AWS CDK Infrastructure

AWS CDK TypeScript application that provisions the Flask Lambda API infrastructure using AWS Blocks / CDK constructs.

## What's Provisioned

Per environment (`dev` and `prod`), in a separate CloudFormation stack:

| Resource | dev | prod |
|---|---|---|
| Lambda function | `flask-lambda-api-dev` | `flask-lambda-api-prod` |
| API Gateway HTTP API | `flask-lambda-api-dev` (stage: `dev`) | `flask-lambda-api-prod` (stage: `prod`) |
| Lambda log group | `/aws/lambda/flask-lambda-api-dev` (7 day retention) | `/aws/lambda/flask-lambda-api-prod` (30 day retention) |
| API Gateway log group | `/aws/apigateway/flask-lambda-api-dev` | `/aws/apigateway/flask-lambda-api-prod` |
| IAM execution role | `AWSLambdaBasicExecutionRole` only | same |

## Prerequisites

- Node.js 18+
- AWS CLI configured with credentials
- CDK bootstrapped in target account/region (run once)

## Setup

```bash
cd infra

# Install dependencies (exact versions from package-lock.json)
npm ci
```

## First-Time Bootstrap

Run once per AWS account + region:

```bash
npx cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

## Deploy Commands

```bash
# Validate IaC (no AWS API calls, safe to run anytime)
npm run synth:dev
npm run synth:prod

# Deploy to dev
npm run deploy:dev

# Deploy to prod
npm run deploy:prod

# Tear down dev environment
npm run destroy:dev
```

## Manual Deploy (explicit context)

```bash
npx cdk deploy AppStack-dev --context envName=dev --require-approval never
npx cdk deploy AppStack-prod --context envName=prod --require-approval never
```

## CloudFormation Outputs

After deploy, the following outputs are available:

| Output | Description |
|---|---|
| `ApiUrl` | Full API invoke URL (e.g. `https://xyz.execute-api.us-east-1.amazonaws.com/dev`) |
| `LambdaFunctionArn` | Lambda function ARN |
| `EnvironmentName` | Deployed environment name |

Retrieve via CLI:
```bash
aws cloudformation describe-stacks \
  --stack-name AppStack-dev \
  --query "Stacks[0].Outputs"
```

## Project Structure

```
infra/
├── app.ts              ← CDK app entry point (reads envName context)
├── stacks/
│   └── app-stack.ts    ← AppStack: Lambda + API GW + IAM + CloudWatch
├── package.json        ← pinned exact dependency versions
├── tsconfig.json       ← TypeScript compiler config
├── cdk.json            ← CDK app config + local dev context defaults
└── README.md           ← this file
```

## Architecture Decisions

See `aidlc-docs/construction/infra/` for full design documentation and `README.md` at the project root for the architecture decision table.
