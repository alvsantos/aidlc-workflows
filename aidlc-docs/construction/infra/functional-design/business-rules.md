# Business Rules — Unit: infra

## BR-INFRA-01: envName must be explicitly provided

**Rule**: The CDK app MUST fail at synth time with a clear error message if `envName` context is not set.
**Implementation**: `app.node.tryGetContext("envName") ?? (() => { throw new Error("envName context is required. Pass --context envName=dev|prod") })()`
**Rationale**: Prevents accidental deployment to wrong environment due to missing context.

---

## BR-INFRA-02: envName must be a known value

**Rule**: `AppStack._resolveConfig()` MUST throw an error for any `envName` value other than `"dev"` or `"prod"`.
**Rationale**: Unknown environment names would silently create misconfigured stacks.

---

## BR-INFRA-03: Stack names must include envName suffix

**Rule**: The CDK stack MUST be named `AppStack-${envName}` to ensure dev and prod stacks are always distinct CloudFormation stacks.
**Rationale**: Prevents accidental overwrite of prod with dev deployment.

---

## BR-INFRA-04: IAM execution role must be least-privilege

**Rule**: The Lambda execution role MUST only have `AWSLambdaBasicExecutionRole` — no additional permissions.
**Rationale**: The API is stateless and makes no AWS API calls at runtime. Any additional permissions would violate least-privilege (SECURITY-06).

---

## BR-INFRA-05: CloudWatch Log Group must have explicit retention

**Rule**: The Lambda log group MUST set retention to `ONE_WEEK` (dev) or `ONE_MONTH` (prod).
**Rationale**: Without explicit retention, Lambda log groups default to "Never expire", leading to unbounded cost accumulation (NFR-05 cost awareness, NFR-04 observability).

---

## BR-INFRA-06: API Gateway access logging must be enabled

**Rule**: The HTTP API stage MUST have access logging configured to a dedicated CloudWatch Log Group.
**Rationale**: SECURITY-02 requires access logging on all network-facing intermediaries (API Gateway is one).

---

## BR-INFRA-07: All dependency versions must be pinned

**Rule**: `package.json` MUST use exact version strings (no `^` or `~` prefixes) for all CDK and AWS Blocks dependencies.
**Rationale**: Reproducible `cdk synth` output — a moving CDK version can change generated CloudFormation, causing unexpected drift (SECURITY-10, NFR-03).

---

## BR-INFRA-08: Lambda timeout must be set explicitly

**Rule**: Lambda function MUST have `timeout` set to `Duration.seconds(30)`.
**Rationale**: Without a timeout, Lambda defaults to 3 seconds — too short if Powertools cold-start initialization is slow. 30 seconds is a safe upper bound for a simple API.
