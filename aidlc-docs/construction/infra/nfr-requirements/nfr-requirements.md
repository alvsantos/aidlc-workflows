# NFR Requirements — Unit: infra

## Security (SECURITY extension — enforced)

### SECURITY-01: Encryption at rest and in transit
- API Gateway HTTP API enforces HTTPS only — no HTTP endpoint exposed
- CloudWatch Logs are encrypted at rest by default (AWS-managed KMS key)
- No S3 buckets or other storage in this unit — N/A for cross-service encryption

### SECURITY-02: Access logging on network intermediaries
- API Gateway HTTP API stage MUST have access logging enabled to a dedicated CloudWatch Log Group
- Log format MUST capture: requestId, sourceIp, httpMethod, routeKey, status, responseLatency

### SECURITY-06: Least-privilege IAM
- Lambda execution role MUST have only `AWSLambdaBasicExecutionRole`
- No wildcard actions (`*`) in any policy
- No wildcard resources (`*`) in any policy
- CDK deploy role in PipelineStack (unit: pipeline) will handle CDK bootstrap permissions

### SECURITY-07: Restrictive network configuration
- Lambda function runs in the AWS-managed VPC (no custom VPC needed for this project)
- API Gateway is public-facing — acceptable for this demo; WAF is out of scope
- No inbound rules to manage (Lambda is not in a security group unless VPC-attached)

### SECURITY-09: Hardening
- No default credentials anywhere in CDK stack
- Stack will NOT deploy sample/demo Lambda code — only the `app/` asset
- CDK stack removal policy: `DESTROY` for dev (easy cleanup), `RETAIN` for prod log groups

### SECURITY-10: Dependency pinning
- `package.json` MUST use exact versions (no `^` or `~`) for all dependencies
- `package-lock.json` MUST be committed and used in CI (`npm ci` not `npm install`)

---

## Observability

| Requirement | Implementation |
|---|---|
| Lambda invocation metrics | Automatic — CloudWatch Lambda metrics (Invocations, Errors, Duration, Throttles) |
| Lambda logs | CloudWatch Log Group with explicit retention (7d dev, 30d prod) |
| API Gateway access logs | Enabled on HTTP API stage — requestId, IP, method, route, status, latency |
| API Gateway execution logs | Not needed — HTTP API doesn't support execution logging (only access logging) |

---

## Reproducibility

| Requirement | Implementation |
|---|---|
| Deterministic synth | Exact CDK version + exact AWS Blocks version pinned in package.json |
| Idempotent deploy | CDK/CloudFormation — re-running `cdk deploy` on unchanged stack is a no-op |
| Environment isolation | Separate CloudFormation stacks (AppStack-dev, AppStack-prod) — no shared resources |

---

## Cost

| Resource | Cost model | Estimate |
|---|---|---|
| Lambda | $0 in Free Tier (1M requests/month, 400K GB-seconds) | Free for demo load |
| API Gateway HTTP API | $1.00/million requests (Free Tier: 1M/month for 12 months) | Free for demo |
| CloudWatch Logs ingestion | $0.50/GB ingested | Negligible for demo |
| CloudWatch Logs storage | $0.03/GB/month | Negligible at 7–30 day retention |

**Total estimated cost for demo workload: ~$0/month**
