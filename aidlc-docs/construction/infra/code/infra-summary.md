# Code Summary — Unit: infra

## Generated Files

| File | Purpose | Stories |
|---|---|---|
| `infra/app.ts` | CDK app entry — reads envName context, instantiates AppStack | S-06, S-07 |
| `infra/stacks/app-stack.ts` | AppStack — all resource definitions | S-06, S-07, S-08, S-09 |
| `infra/package.json` | Pinned exact CDK + TypeScript dependencies | SECURITY-10 |
| `infra/tsconfig.json` | TypeScript strict compiler config | — |
| `infra/cdk.json` | CDK app config + local dev context defaults | — |
| `infra/README.md` | Setup, deploy, bootstrap instructions | FR-07 |

## Key Implementation Decisions

| Decision | Implementation |
|---|---|
| Env differences centralised | `resolveConfig(envName)` function — single source of truth |
| Log group pre-creation | Created before Lambda to ensure retention from first invocation |
| IAM least-privilege | Only `AWSLambdaBasicExecutionRole` — explicit role, no CDK auto-grant |
| API Gateway type | HTTP API v2 (`apigwv2.HttpApi`) — not REST API |
| Access logging | Separate log group per env, JSON format capturing 9 fields |
| Asset bundling | Docker-based `pip install -r requirements.txt` at synth time |
| Removal policy | `DESTROY` for dev, `RETAIN` for prod log groups |

## Security Compliance (Code Generation stage)

| Rule | Status | Implementation |
|---|---|---|
| SECURITY-01 (Encryption in transit) | ✅ | API Gateway HTTP API enforces HTTPS |
| SECURITY-02 (Access logging) | ✅ | `accessLogSettings` on HTTP API stage with JSON format |
| SECURITY-06 (Least-privilege IAM) | ✅ | Explicit role with `AWSLambdaBasicExecutionRole` only |
| SECURITY-07 (Network config) | ✅ | No custom VPC; Lambda in AWS-managed network |
| SECURITY-09 (Hardening) | ✅ | No sample code, explicit timeout, no default credentials |
| SECURITY-10 (Dependency pinning) | ✅ | Exact versions in package.json; `npm ci` in CI |
| Others | N/A | Not applicable to IaC unit |
