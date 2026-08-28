# Business Logic Model — Unit: infra

## Overview

The `infra` unit is a CDK TypeScript application that provisions all AWS resources for the Python REST API. It has no runtime business logic — its "logic" is the infrastructure definition that runs at CDK synth and deploy time.

There are two instantiations of `AppStack`: one for `dev` and one for `prod`. Both use the same construct code; environment differences are driven by the `envName` prop.

---

## CDK App Entry Point (`app.ts`)

```
cdk deploy AppStack-dev  (or AppStack-prod)
        |
        v
app.ts  — creates CDK App instance
        — reads envName from CDK context: app.node.tryGetContext("envName")
        — instantiates AppStack with props: { envName }
        — CDK synthesises to CloudFormation template
        — CloudFormation deploys changeset
```

### Context Resolution Order

1. `--context envName=dev` CLI flag (used by pipeline)
2. `context.envName` in `cdk.json` (local dev fallback)
3. If neither is set → throw error at synth time (fail fast)

---

## AppStack Construction Flow

```
new AppStack(app, `AppStack-${envName}`, { envName })
        |
        ├── _resolveConfig(envName)     → env-specific settings object
        ├── _createExecutionRole()      → IAM role for Lambda
        ├── _createLambdaFunction(role) → Lambda function + log group
        ├── _createHttpApi(fn)          → API Gateway HTTP API + integration
        └── _createOutputs(api, fn)     → CloudFormation outputs
```

---

## Resource Definitions

### Lambda Function

| Property | Value | Notes |
|---|---|---|
| Runtime | `Runtime.PYTHON_3_11` | Matches app/ Python version |
| Handler | `main.handler` | `main.py` → `handler()` function |
| Code | `Code.fromAsset("../app", { bundling: ... })` | CDK bundles app/ at synth time |
| Memory | 128 MB (dev) / 256 MB (prod) | From env config |
| Timeout | 30 seconds | Sufficient for a simple API; no long-running ops |
| Environment vars | `ENV`, `APP_VERSION`, `LOG_LEVEL`, `POWERTOOLS_SERVICE_NAME`, `POWERTOOLS_TRACE_DISABLED` | All set from CDK stack |
| Log group | Explicit `LogGroup` with retention | Prevents indefinite log accumulation |

### Asset Bundling (CDK BundlingOptions)

CDK bundles the Python Lambda zip at `cdk synth` time using a Docker container:

```typescript
bundling: {
  image: Runtime.PYTHON_3_11.bundlingImage,
  command: [
    "bash", "-c",
    "pip install -r requirements.txt -t /asset-output && cp -r . /asset-output"
  ],
}
```

This ensures the Lambda zip contains the installed packages, not just source files.

### API Gateway HTTP API

| Property | Value | Notes |
|---|---|---|
| Type | HTTP API (`HttpApi`) | Lower cost + lower latency than REST API |
| Integration | `HttpLambdaIntegration` (Lambda proxy) | All routes proxied to Lambda |
| Default route | `ANY /{proxy+}` | Catches all paths, Powertools resolver handles routing |
| Stage name | `envName` value | `dev` or `prod` |
| Access logging | Enabled → CloudWatch Log Group | Required by SECURITY-02 |

### IAM Execution Role

| Property | Value |
|---|---|
| Principal | `lambda.amazonaws.com` |
| Managed policies | `AWSLambdaBasicExecutionRole` only |
| Inline policies | None |

---

## Environment Differences (dev vs prod)

All differences are encapsulated in `_resolveConfig()`:

```typescript
function _resolveConfig(envName: string) {
  const configs = {
    dev: {
      memorySize: 128,
      logRetention: RetentionDays.ONE_WEEK,
      logLevel: "DEBUG",
      traceDisabled: "true",
    },
    prod: {
      memorySize: 256,
      logRetention: RetentionDays.ONE_MONTH,
      logLevel: "INFO",
      traceDisabled: "false",
    },
  };
  if (!configs[envName]) throw new Error(`Unknown envName: ${envName}`);
  return configs[envName];
}
```

This single function is the only place environment differences are defined — no `if (envName === "prod")` scattered through the stack code.
