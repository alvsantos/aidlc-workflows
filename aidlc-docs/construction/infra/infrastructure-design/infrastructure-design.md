# Infrastructure Design — Unit: infra

## AWS Services Mapping

| Logical Component | AWS Service | CDK Construct | Notes |
|---|---|---|---|
| Lambda function | AWS Lambda | `lambda.Function` | Python 3.11, zip asset |
| Lambda logs | Amazon CloudWatch Logs | `logs.LogGroup` | Pre-created with retention |
| API exposure | Amazon API Gateway HTTP API | `apigwv2.HttpApi` | v2, Lambda proxy |
| API access logs | Amazon CloudWatch Logs | `logs.LogGroup` | Separate log group from Lambda |
| IAM role | AWS IAM | `iam.Role` | Least-privilege execution role |
| Lambda zip packaging | CDK Asset Bundling | `lambda.Code.fromAsset` + `BundlingOptions` | Docker-based pip install |

## Deployment Architecture

```
AWS Account
+--------------------------------------------------------------+
|                                                              |
|  CloudFormation Stack: AppStack-dev / AppStack-prod          |
|                                                              |
|  +------------------+      +-----------------------------+  |
|  | API Gateway       |      | Lambda Function             |  |
|  | HTTP API          | ---> | flask-lambda-api-{env}      |  |
|  | Stage: dev/prod   |      | Runtime: Python 3.11        |  |
|  | ANY /{proxy+}     |      | Handler: main.handler       |  |
|  +------------------+      | Memory: 128/256 MB          |  |
|         |                  | Timeout: 30s                |  |
|         | access logs      | Env: ENV, APP_VERSION, ...  |  |
|         v                  +-----------------------------+  |
|  +------------------+              |                        |
|  | CW Log Group     |              | execution role         |
|  | /aws/apigateway/ |              v                        |
|  | retention: 7/30d |      +-----------------------------+  |
|  +------------------+      | IAM Role                    |  |
|                             | AWSLambdaBasicExecutionRole |  |
|                             +-----------------------------+  |
|                                     |                        |
|                                     | writes logs            |
|                                     v                        |
|                             +-----------------------------+  |
|                             | CW Log Group                |  |
|                             | /aws/lambda/                |  |
|                             | retention: 7/30d            |  |
|                             +-----------------------------+  |
+--------------------------------------------------------------+
```

## CDK App Structure

```
infra/
├── app.ts                     ← CDK app entry; reads envName context; instantiates stacks
├── stacks/
│   └── app-stack.ts           ← AppStack class; all resource definitions
├── cdk.json                   ← CDK config; default context for local dev
├── tsconfig.json              ← TypeScript config
└── package.json               ← pinned dependencies
```

## Deploy Commands

```bash
# Bootstrap (once per account/region)
npx cdk bootstrap aws://ACCOUNT_ID/REGION

# Synthesise (validate — no AWS API calls)
npx cdk synth --context envName=dev

# Deploy dev
npx cdk deploy AppStack-dev --context envName=dev --require-approval never

# Deploy prod
npx cdk deploy AppStack-prod --context envName=prod --require-approval never

# Tear down dev (DESTROY removal policy)
npx cdk destroy AppStack-dev --context envName=dev
```

## Region & Account

- Single region: `us-east-1` (default; override via CDK environment or `AWS_DEFAULT_REGION`)
- Single account for both dev and prod (demo project — separate accounts out of scope)
- CDK uses environment-agnostic stacks (no account/region hardcoded) — resolved at deploy time from AWS credentials
