# Domain Entities — Unit: app

This is a stateless API with no persistent domain model. The "entities" here are the data shapes flowing through the system.

---

## Request Entities

### PathParameters

| Field | Type | Constraints | Used by |
|---|---|---|---|
| `name` | string | 1–50 chars, `^[a-zA-Z0-9 _\-]+$` | `GET /hello/{name}` |

---

## Response Entities

### HealthResponse

| Field | Type | Example |
|---|---|---|
| `status` | string (enum: `"ok"`) | `"ok"` |
| `environment` | string | `"dev"` |

### GreetingResponse

| Field | Type | Example |
|---|---|---|
| `message` | string | `"Hello, World!"` |

### VersionResponse

| Field | Type | Example |
|---|---|---|
| `version` | string (semver) | `"0.1.0"` |
| `environment` | string | `"prod"` |
| `python_version` | string | `"3.11.9 (main, ...)"` |

### ErrorResponse

| Field | Type | Example |
|---|---|---|
| `statusCode` | integer | `400` |
| `message` | string | `"Invalid name parameter"` |

---

## Environment Variables (runtime configuration)

| Variable | Type | Default | Set by | Used by |
|---|---|---|---|---|
| `ENV` | string | `"unknown"` | CDK `AppStack` | `/health`, `/version` |
| `APP_VERSION` | string | `"0.1.0"` | CDK `AppStack` | `/version` |
| `LOG_LEVEL` | string | `"INFO"` | CDK `AppStack` | Powertools Logger |
| `POWERTOOLS_SERVICE_NAME` | string | `"flask-lambda-api"` | CDK `AppStack` | Powertools Logger/Tracer |
| `POWERTOOLS_TRACE_DISABLED` | string | `"true"` (dev) | CDK `AppStack` | Powertools Tracer |

---

## File Structure

```
app/
├── main.py              ← Lambda handler + route registrations
├── requirements.txt     ← pinned runtime dependencies
└── tests/
    └── test_main.py     ← pytest unit tests
```
