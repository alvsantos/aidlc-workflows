# NFR Design Patterns — Unit: app

## Pattern 1: API Gateway Event Routing (Powertools ApiGatewayResolver)

**NFR addressed**: Performance, Maintainability
**Pattern**: Single Lambda handler delegates routing to Powertools `ApiGatewayResolver` using decorator-based route registration.

```python
# Implementation pattern
from aws_lambda_powertools.event_handler import ApiGatewayResolver, Response

app = ApiGatewayResolver()

@app.get("/health")
def get_health(): ...

@app.get("/hello/<name>")
def get_hello(name: str): ...

@app.get("/version")
def get_version(): ...

def handler(event, context):
    return app.resolve(event, context)
```

**Why this pattern**: Zero-overhead routing — no WSGI layer, no HTTP server spin-up. The resolver is instantiated once at module level (outside handler) so it persists across warm invocations, avoiding re-registration cost on every call.

---

## Pattern 2: Input Validation — Allowlist Regex Guard

**NFR addressed**: Security (SECURITY-05)
**Pattern**: Explicit allowlist validation before any string processing. Raises `BadRequestError` (Powertools built-in → HTTP 400) on failure. Never reflects invalid input back in the error message.

```python
import re
from aws_lambda_powertools.event_handler.exceptions import BadRequestError

NAME_PATTERN = re.compile(r'^[a-zA-Z0-9 _\-]+$')
MAX_NAME_LENGTH = 50

def _validate_name(name: str) -> None:
    """Raises BadRequestError if name fails validation."""
    name = name.strip()
    if not name or len(name) > MAX_NAME_LENGTH or not NAME_PATTERN.match(name):
        raise BadRequestError("Invalid name parameter")
```

**Why this pattern**: Centralised validation in a private helper keeps controller code clean. `BadRequestError` is caught by Powertools resolver — no unhandled exception propagates to the Lambda runtime.

---

## Pattern 3: Structured Logging (Powertools Logger)

**NFR addressed**: Observability, Security (SECURITY-03)
**Pattern**: Module-level Logger instance, injected with Lambda context via `@logger.inject_lambda_context` decorator on the handler.

```python
from aws_lambda_powertools import Logger

logger = Logger(service="flask-lambda-api")

@logger.inject_lambda_context(log_event=False)  # log_event=False prevents logging raw event
def handler(event, context):
    return app.resolve(event, context)
```

**Key settings**:
- `log_event=False` — raw event body is never logged (SECURITY-03: no PII/secrets in logs)
- `Logger` auto-captures: `function_request_id`, `cold_start`, `function_name`, `function_memory_size`
- Log level controlled by `LOG_LEVEL` env var (set by CDK stack — `INFO` in prod, `DEBUG` in dev)

---

## Pattern 4: Global Exception Handling (Fail Closed)

**NFR addressed**: Security (SECURITY-09, SECURITY-15), Reliability
**Pattern**: Powertools `ApiGatewayResolver` catches all unhandled exceptions. Additionally, a custom exception handler is registered for `Exception` to guarantee the response shape.

```python
@app.exception_handler(Exception)
def handle_generic_exception(ex: Exception):
    logger.exception("Unhandled exception")  # logs stack trace to CloudWatch only
    return Response(
        status_code=500,
        content_type="application/json",
        body={"statusCode": 500, "message": "Internal Server Error"},
    )
```

**Why this pattern**:
- Stack trace goes to CloudWatch (operator-visible) but NOT to the API response (SECURITY-09)
- Response is always a well-formed JSON object — no raw exception strings reach the caller
- `logger.exception()` automatically captures traceback in the structured log entry

---

## Pattern 5: Safe Environment Variable Access

**NFR addressed**: Reliability (BR-03)
**Pattern**: All env var reads use `os.environ.get(key, default)` — never `os.environ[key]`.

```python
import os

ENV = os.environ.get("ENV", "unknown")
APP_VERSION = os.environ.get("APP_VERSION", "0.1.0")
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
```

These are read **once at module load time** (outside the handler function) so they are cached across warm invocations.

**Why this pattern**: Prevents `KeyError` on Lambda cold start if CDK stack misconfigures env vars. Returns safe fallback values so the API remains functional.

---

## Pattern 6: Dependency Pinning

**NFR addressed**: Security (SECURITY-10), Reproducibility (NFR-03)
**Pattern**: `requirements.txt` uses exact version pins, no ranges.

```
# requirements.txt
aws-lambda-powertools==2.43.1
```

**Dev dependencies** are kept in a separate `requirements-dev.txt` and never bundled into the Lambda zip:
```
# requirements-dev.txt
pytest==7.4.4
flake8==6.1.0
pytest-cov==4.1.0
```

**Why this pattern**: Lambda zip artifact must be deterministic — same code always produces the same deployment package. Open ranges (`>=2`) risk introducing breaking changes on rebuild.
