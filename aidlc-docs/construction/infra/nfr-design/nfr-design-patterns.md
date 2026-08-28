# NFR Design Patterns — Unit: infra

## Pattern 1: Environment Config Centralisation

**NFR addressed**: Maintainability, Reproducibility
**Pattern**: All environment-specific values live in a single `_resolveConfig()` function. No scattered conditionals through the stack.

```typescript
type EnvConfig = {
  memorySize: number;
  logRetention: RetentionDays;
  logLevel: string;
  traceDisabled: string;
  removalPolicy: RemovalPolicy;
};

function resolveConfig(envName: string): EnvConfig {
  const configs: Record<string, EnvConfig> = {
    dev: {
      memorySize: 128,
      logRetention: RetentionDays.ONE_WEEK,
      logLevel: "DEBUG",
      traceDisabled: "true",
      removalPolicy: RemovalPolicy.DESTROY,
    },
    prod: {
      memorySize: 256,
      logRetention: RetentionDays.ONE_MONTH,
      logLevel: "INFO",
      traceDisabled: "false",
      removalPolicy: RemovalPolicy.RETAIN,
    },
  };
  if (!configs[envName]) {
    throw new Error(`Unknown envName: "${envName}". Must be "dev" or "prod".`);
  }
  return configs[envName];
}
```

---

## Pattern 2: Explicit IAM Least-Privilege Role (SECURITY-06)

**Pattern**: Create a dedicated role with only `AWSLambdaBasicExecutionRole`. CDK does NOT automatically create a permissive role — we define it explicitly to document intent.

```typescript
const executionRole = new iam.Role(this, "LambdaExecutionRole", {
  assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
  description: "Least-privilege execution role for flask-lambda-api",
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName(
      "service-role/AWSLambdaBasicExecutionRole"
    ),
  ],
});
```

---

## Pattern 3: Explicit Log Group with Retention (SECURITY-02, NFR-04)

**Pattern**: Create the Lambda log group explicitly before the function, so retention is controlled from day one. Lambda would auto-create a log group without retention if we don't pre-create it.

```typescript
const logGroup = new logs.LogGroup(this, "LambdaLogGroup", {
  logGroupName: `/aws/lambda/flask-lambda-api-${envName}`,
  retention: config.logRetention,
  removalPolicy: config.removalPolicy,
});
```

---

## Pattern 4: CDK Asset Bundling for Python Lambda

**Pattern**: Use CDK's built-in bundling to install Python dependencies into the Lambda zip at synth time. This ensures the deployed artifact always matches the pinned `requirements.txt`.

```typescript
const fn = new lambda.Function(this, "ApiFunction", {
  runtime: lambda.Runtime.PYTHON_3_11,
  handler: "main.handler",
  code: lambda.Code.fromAsset(path.join(__dirname, "../../app"), {
    bundling: {
      image: lambda.Runtime.PYTHON_3_11.bundlingImage,
      command: [
        "bash", "-c",
        "pip install -r requirements.txt -t /asset-output && cp -r . /asset-output",
      ],
    },
  }),
  // ...
});
```

---

## Pattern 5: API Gateway Access Logging (SECURITY-02)

**Pattern**: Create a dedicated log group for API Gateway access logs and configure the HTTP API stage to write to it.

```typescript
const apiAccessLogGroup = new logs.LogGroup(this, "ApiAccessLogGroup", {
  logGroupName: `/aws/apigateway/flask-lambda-api-${envName}`,
  retention: config.logRetention,
  removalPolicy: config.removalPolicy,
});

const httpApi = new apigwv2.HttpApi(this, "HttpApi", {
  defaultIntegration: new integrations.HttpLambdaIntegration("LambdaIntegration", fn),
  createDefaultStage: false,
});

httpApi.addStage("DefaultStage", {
  stageName: envName,
  autoDeploy: true,
  throttle: { rateLimit: 100, burstLimit: 50 },
  accessLogSettings: {
    destinationArn: apiAccessLogGroup.logGroupArn,
    format: JSON.stringify({
      requestId: "$context.requestId",
      sourceIp: "$context.identity.sourceIp",
      requestTime: "$context.requestTime",
      httpMethod: "$context.httpMethod",
      routeKey: "$context.routeKey",
      status: "$context.status",
      protocol: "$context.protocol",
      responseLatency: "$context.responseLatency",
    }),
  },
});
```

---

## Pattern 6: Dependency Pinning in package.json (SECURITY-10)

**Pattern**: All versions are exact strings — no `^` or `~` range operators.

```json
{
  "dependencies": {
    "aws-cdk-lib": "2.143.0",
    "constructs": "10.3.0"
  },
  "devDependencies": {
    "typescript": "5.4.5",
    "ts-node": "10.9.2",
    "@types/node": "18.19.31",
    "aws-cdk": "2.143.0"
  }
}
```

`package-lock.json` is committed and CI uses `npm ci` (not `npm install`) to guarantee exact versions are used.
