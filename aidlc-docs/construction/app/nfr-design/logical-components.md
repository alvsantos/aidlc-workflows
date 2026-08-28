# Logical Components — Unit: app

Logical components are the cross-cutting infrastructure elements used by the `app` unit. For a Lambda function, these are all in-process — no external infrastructure components are needed.

---

## Component: Powertools Logger

**Type**: In-process observability
**Logical role**: Centralized structured logging across all route handlers
**Implementation**: `aws_lambda_powertools.Logger`

**Configuration**:
```python
logger = Logger(
    service="flask-lambda-api",   # appears in every log entry as "service"
    level=LOG_LEVEL,              # from env var, default "INFO"
)
```

**Integration points**:
- Handler: `@logger.inject_lambda_context(log_event=False)` — auto-adds Lambda context fields
- Controllers: `logger.info("...")` for informational events, `logger.exception("...")` for errors
- Output: CloudWatch Logs (automatic Lambda stdout routing)

---

## Component: Powertools ApiGatewayResolver

**Type**: In-process routing
**Logical role**: HTTP method + path routing for API Gateway HTTP API proxy events
**Implementation**: `aws_lambda_powertools.event_handler.ApiGatewayResolver`

**Configuration**:
```python
app = ApiGatewayResolver()
# Routes registered via @app.get("/path") decorators
```

**Integration points**:
- Receives raw Lambda `event` dict from API Gateway HTTP API proxy format
- Dispatches to registered route handler functions
- Serialises response dict into API GW proxy response format
- Handles `BadRequestError` → 400, `NotFoundError` → 404, unhandled `Exception` → 500

---

## Component: Input Validator

**Type**: In-process validation utility
**Logical role**: Centralised parameter validation for path parameters
**Implementation**: Module-level compiled regex + validation function in `main.py`

```python
NAME_PATTERN = re.compile(r'^[a-zA-Z0-9 _\-]+$')

def _validate_name(name: str) -> None:
    name = name.strip()
    if not name or len(name) > 50 or not NAME_PATTERN.match(name):
        raise BadRequestError("Invalid name parameter")
```

**Integration points**: Called by `HelloController.get_hello()` before any processing

---

## Component: Powertools Tracer (optional)

**Type**: In-process distributed tracing
**Logical role**: AWS X-Ray trace segments per Lambda invocation
**Implementation**: `aws_lambda_powertools.Tracer`

**Configuration**:
```python
tracer = Tracer()  # reads POWERTOOLS_TRACE_DISABLED from env
```

**Behaviour by environment**:
- `dev`: `POWERTOOLS_TRACE_DISABLED=true` — tracer is a no-op, no X-Ray cost
- `prod`: disabled by default for this demo (can be enabled by setting `POWERTOOLS_TRACE_DISABLED=false` in CDK stack)

---

## Component: CloudWatch Log Group (external — provisioned by infra unit)

**Type**: External infrastructure (provisioned by `infra` unit's `AppStack`)
**Logical role**: Log storage and retention for Lambda structured logs
**Retention**:
- dev: 7 days
- prod: 30 days

**Note**: This component is not code in the `app` unit — it is referenced here for completeness. Lambda automatically writes stdout to the log group `/aws/lambda/<function-name>`.

---

## No External Logical Components Required

The `app` unit is deliberately minimal:
- No database or cache (stateless API)
- No message queue or event bus
- No circuit breaker (no downstream service calls)
- No secrets manager calls at runtime (no sensitive config needed beyond env vars)

This keeps cold start latency low and the deployment artifact small.
