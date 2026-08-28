# Domain Entities — Unit: infra

The `infra` unit has no runtime domain model. Its "entities" are the CDK construct props, stack inputs, and CloudFormation outputs that define the infrastructure contract.

---

## Stack Input Props

### AppStackProps

| Field | Type | Required | Description |
|---|---|---|---|
| `envName` | `string` | Yes | `"dev"` or `"prod"` — drives all environment-specific config |

---

## Environment Configuration Map

These values are derived from `envName` inside `AppStack`:

| Property | dev | prod |
|---|---|---|
| Stack name | `AppStack-dev` | `AppStack-prod` |
| Lambda memory (MB) | `128` | `256` |
| Log retention | `RetentionDays.ONE_WEEK` (7 days) | `RetentionDays.ONE_MONTH` (30 days) |
| Lambda env: `ENV` | `"dev"` | `"prod"` |
| Lambda env: `LOG_LEVEL` | `"DEBUG"` | `"INFO"` |
| Lambda env: `POWERTOOLS_TRACE_DISABLED` | `"true"` | `"false"` |

---

## CloudFormation Outputs

| Output Key | Value | Consumed by |
|---|---|---|
| `ApiUrl` | HTTP API invoke URL | Developer, pipeline smoke tests |
| `LambdaFunctionArn` | Lambda function ARN | Ops/monitoring |
| `EnvironmentName` | `envName` value | Reference / documentation |

---

## CDK Context Keys (`cdk.json`)

| Key | Type | Example | Description |
|---|---|---|---|
| `envName` | string | `"dev"` | Passed at synth/deploy time; read by `AppStack` constructor |

---

## File Structure

```
infra/
├── app.ts                  ← CDK app entry point
├── stacks/
│   └── app-stack.ts        ← AppStack (Lambda + API GW + IAM + CloudWatch)
├── package.json            ← CDK + AWS Blocks dependencies (pinned)
├── package-lock.json       ← lockfile
├── tsconfig.json           ← TypeScript compiler config
└── cdk.json                ← CDK app config + context defaults
```
