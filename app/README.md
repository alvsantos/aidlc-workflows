# app — Python REST API

Flask-style REST API built with [AWS Lambda Powertools](https://docs.powertools.aws.dev/lambda/python/latest/), deployed to AWS Lambda via API Gateway HTTP API.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness probe — returns `{"status": "ok", "environment": "<env>"}` |
| GET | `/hello/<name>` | Parameterised greeting — returns `{"message": "Hello, <name>!"}` |
| GET | `/version` | Runtime metadata — returns version, environment, Python version |

### Input Validation (`GET /hello/<name>`)

- `name` must be 1–50 characters
- Allowed characters: alphanumeric, spaces, underscores (`_`), hyphens (`-`)
- Returns HTTP 400 with `{"statusCode": 400, "message": "Invalid name parameter"}` on failure

## Local Development

### Prerequisites

- Python 3.11+
- pip

### Setup

```bash
cd app

# Create a virtual environment
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dev dependencies
pip install -r requirements-dev.txt
```

### Run Unit Tests

```bash
# From the app/ directory
pytest tests/ -v

# With coverage report
pytest tests/ -v --cov=. --cov-report=term-missing
```

### Run Linter

```bash
flake8 . --max-line-length=100
```

### Test Locally (without Lambda)

You can invoke the handler directly in a Python REPL for quick checks:

```python
from app.main import handler

# Simulate a GET /health request
event = {
    "version": "2.0",
    "routeKey": "GET /health",
    "rawPath": "/health",
    "rawQueryString": "",
    "headers": {},
    "requestContext": {
        "http": {"method": "GET", "path": "/health"},
        "requestId": "local-test",
    },
    "isBase64Encoded": False,
}

class FakeContext:
    function_name = "local"
    memory_limit_in_mb = 128
    invoked_function_arn = "arn:aws:lambda:local"
    aws_request_id = "local-test"
    def get_remaining_time_in_millis(self): return 30000

print(handler(event, FakeContext()))
```

## Environment Variables

Set by the CDK `AppStack` at deploy time — not required for local unit tests.

| Variable | Description | Default |
|---|---|---|
| `ENV` | Environment name (`dev` or `prod`) | `"unknown"` |
| `APP_VERSION` | Application version string | `"0.1.0"` |
| `LOG_LEVEL` | Powertools Logger level (`DEBUG`, `INFO`) | `"INFO"` |
| `POWERTOOLS_SERVICE_NAME` | Service name in log entries | `"flask-lambda-api"` |
| `POWERTOOLS_TRACE_DISABLED` | Disable X-Ray tracing (`true`/`false`) | not set (tracing enabled) |

## File Structure

```
app/
├── main.py              ← Lambda handler + all route controllers
├── requirements.txt     ← pinned runtime deps (bundled into Lambda zip)
├── requirements-dev.txt ← pinned dev/test deps (not bundled)
├── README.md            ← this file
└── tests/
    ├── __init__.py
    └── test_main.py     ← pytest unit tests
```
