# Tech Stack Decisions — Unit: infra

## IaC Tool

| Dimension | AWS Blocks | Raw CDK L2 | CloudFormation YAML |
|---|---|---|---|
| Abstraction | Highest — opinionated, minimal config | Medium — explicit but typed | Lowest — verbose JSON/YAML |
| Language | TypeScript (CDK under the hood) | TypeScript / Python / Java | YAML / JSON |
| State management | CloudFormation (no state file) | CloudFormation | CloudFormation |
| Learning curve | Low for CDK users | Medium | High |
| **Decision** | ✅ **Primary** | Reference (README comparison) | — |

**Note on AWS Blocks availability**: At time of implementation, verify the specific AWS Blocks constructs available for Lambda + HTTP API. If AWS Blocks does not yet have constructs for a specific resource, fall back to CDK L2 constructs directly — AWS Blocks and CDK L2 compose freely since AWS Blocks generates CDK.

## Runtime

| Dependency | Version | Rationale |
|---|---|---|
| `aws-cdk-lib` | `2.x` (latest stable 2.x) | Core CDK library |
| `constructs` | `10.x` | CDK constructs peer dep |
| `typescript` | `5.x` | CDK TypeScript support |
| `ts-node` | `10.x` | Run TypeScript CDK app directly |
| `@types/node` | `18.x` | Node.js type definitions |

**AWS Blocks** package name and version: `@aws-blocks/aws-blocks` (verify exact package name from [AWS Blocks docs](https://docs.aws.amazon.com/blocks/) at implementation time — the package may be under a different npm scope).

## CDK Context Strategy

| Option | Chosen | Rationale |
|---|---|---|
| `--context envName=dev` CLI flag | ✅ Primary (pipeline + manual) | Explicit at deploy time; no ambiguity |
| `cdk.json` context default | ✅ Fallback (local dev) | Developer convenience — can set `"envName": "dev"` locally |
| Environment variables | ❌ Rejected | CDK context is the idiomatic approach; env vars mix concerns |

## API Gateway Type

| Option | Chosen | Rationale |
|---|---|---|
| HTTP API (`@aws-cdk/aws-apigatewayv2`) | ✅ | Lower cost ($1/M vs $3.50/M), lower latency, sufficient for Lambda proxy use case |
| REST API (`@aws-cdk/aws-apigateway`) | ❌ | Higher cost; features like usage plans and WAF integration not needed here |
| ALB | ❌ | Fixed cost (~$16/month); overkill for Lambda |
