# NFR Requirements — Unit: app

## Scalability

| Requirement | Value | Rationale |
|---|---|---|
| Concurrency | Lambda default (1,000 concurrent executions per account) — no reserved concurrency needed | Stateless API; no shared resource contention |
| Request rate | No explicit throttling at the Lambda level; API Gateway handles burst | Demo project; production would add WAF rate limiting |
| Scaling trigger | Automatic — Lambda scales to demand per invocation | No pre-warming needed for this project |

---

## Performance

| Requirement | Target | Notes |
|---|---|---|
| Cold start latency | < 2 seconds (p99) | Python 3.11 + Powertools is lightweight; zip packaging keeps cold start low |
| Warm invocation latency | < 100 ms | No I/O; pure in-memory computation |
| Response payload size | < 1 KB for all endpoints | Simple JSON responses |
| Lambda memory | 128 MB (dev), 256 MB (prod) | Sufficient for Powertools + Flask routing; set by CDK `AppStack` |

---

## Availability

| Requirement | Value | Notes |
|---|---|---|
| Target uptime | Best-effort (no SLA) | Demo project; Lambda is inherently multi-AZ |
| Failure isolation | Per-invocation — one failed invocation does not affect others | Lambda execution model |
| Retry behaviour | API Gateway HTTP API does not retry on Lambda errors | Client retries are the caller's responsibility |

---

## Security Requirements (SECURITY extension — enforced)

### SECURITY-03: Application-level structured logging
- Logger MUST be configured via Powertools `Logger` with `service=flask-lambda-api`
- Log output MUST be JSON-structured and routed to CloudWatch Logs (automatic for Lambda)
- Logs MUST include: timestamp, request ID, log level, path, method
- Logs MUST NOT include: request body, env var values, stack traces, or any PII

### SECURITY-05: Input validation on all API parameters
- `GET /hello/{name}`: MUST validate `name` against allowlist regex `^[a-zA-Z0-9 _\-]+$`
- `GET /hello/{name}`: MUST enforce max length of 50 characters
- `GET /hello/{name}`: MUST enforce non-empty / non-whitespace
- Invalid input MUST return HTTP 400 with generic error message — no reflection of the invalid value back to the caller
- No other endpoints accept user-supplied parameters

### SECURITY-09: Hardening — no internal details in error responses
- HTTP 500 responses MUST contain only `{"statusCode": 500, "message": "Internal Server Error"}`
- HTTP 400 responses MUST contain only `{"statusCode": 400, "message": "Invalid name parameter"}`
- No stack traces, file paths, framework versions, or Lambda ARNs in any response body

### SECURITY-10: Dependency pinning
- `requirements.txt` MUST pin all dependencies to exact versions (e.g., `aws-lambda-powertools==2.x.x`, not `>=2`)
- No transitive unpinned dependencies

### SECURITY-15: Exception handling and fail-safe defaults
- All route handlers MUST be wrapped by Powertools resolver's built-in exception handler
- Unhandled exceptions MUST be caught before reaching the API Gateway response layer
- Resource cleanup: Lambda functions are stateless — no connections or file handles to release
- Global error handler: Powertools `ApiGatewayResolver` acts as the top-level error boundary

---

## Reliability

| Requirement | Value | Notes |
|---|---|---|
| Idempotency | All endpoints are GET (read-only) — idempotent by nature | No state mutations |
| Error handling | All error paths return well-defined HTTP status codes | See business-rules.md |
| Safe defaults | Env var reads use `os.environ.get(key, default)` — never `os.environ[key]` | Prevents `KeyError` on missing config |

---

## Maintainability

| Requirement | Approach |
|---|---|
| Code structure | Single `main.py` — small enough that a single file is correct; no premature module splitting |
| Dependency versions | All pinned in `requirements.txt` |
| Test coverage | Unit tests for all 3 endpoints (happy path + validation errors) using `pytest` |
| Linting | `flake8` with default rules; enforced in CI pipeline |

---

## Observability

| Requirement | Implementation |
|---|---|
| Structured logs | Powertools `Logger` — JSON output, auto-captured by CloudWatch |
| Request tracing | Powertools `Tracer` (X-Ray) — disabled in dev (`POWERTOOLS_TRACE_DISABLED=true`), can be enabled for prod |
| Log retention | 7 days (dev), 30 days (prod) — set by `AppStack` CloudWatch Log Group |
| Metrics | No custom CloudWatch metrics for this demo; Lambda default metrics (Invocations, Errors, Duration) are sufficient |
