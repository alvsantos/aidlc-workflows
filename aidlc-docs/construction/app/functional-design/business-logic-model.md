# Business Logic Model — Unit: app

## Overview

The `app` unit implements a stateless Python REST API that runs as an AWS Lambda function. All business logic is pure — no database, no external service calls, no side effects beyond logging. The API is invoked via API Gateway HTTP API proxy integration.

---

## Request Processing Flow

```
API Gateway HTTP event
        |
        v
handler(event, context)         ← Lambda entry point (main.py)
        |
        v
ApiGatewayResolver.resolve()    ← Powertools routes by method + path
        |
        +-- GET /health     --> HealthController.get_health()
        +-- GET /hello/{name} -> HelloController.get_hello(name)
        +-- GET /version    --> VersionController.get_version()
        |
        v
dict response                   ← controller returns plain dict
        |
        v
Powertools serialises           ← adds statusCode, headers, body
        |
        v
API Gateway proxy response      ← returned to caller
```

---

## Business Logic per Endpoint

### GET /health

**Purpose**: Liveness probe — confirms the Lambda function is running and reachable.

**Input**: None (no path params, no query params, no body)

**Processing**:
1. Read `ENV` from `os.environ` (set by CDK stack)
2. Return health payload

**Output**:
```json
{
  "status": "ok",
  "environment": "<ENV value>"
}
```
**HTTP Status**: 200

**Error scenarios**: None — this endpoint cannot fail unless Lambda itself is broken.

---

### GET /hello/{name}

**Purpose**: Parameterised greeting — demonstrates path parameter handling and input validation.

**Input**: `name` — path parameter (string)

**Processing**:
1. Extract `name` from path parameters via Powertools resolver
2. **Validate** `name`:
   - Must not be empty or whitespace-only
   - Must be ≤ 50 characters
   - Must match `^[a-zA-Z0-9 _\-]+$` (alphanumeric, spaces, underscores, hyphens only)
3. If validation fails → raise `BadRequestError` (Powertools built-in → HTTP 400)
4. Return greeting

**Output (success)**:
```json
{
  "message": "Hello, <name>!"
}
```
**HTTP Status**: 200

**Output (validation failure)**:
```json
{
  "statusCode": 400,
  "message": "Invalid name parameter"
}
```
**HTTP Status**: 400

**Security note**: The regex allowlist prevents XSS/injection via the name parameter (SECURITY-05).

---

### GET /version

**Purpose**: Runtime metadata endpoint — returns version, environment, and Python runtime info.

**Input**: None

**Processing**:
1. Read `APP_VERSION` from `os.environ` (default: `"0.1.0"` if not set)
2. Read `ENV` from `os.environ` (default: `"unknown"` if not set)
3. Read Python version from `sys.version`

**Output**:
```json
{
  "version": "<APP_VERSION>",
  "environment": "<ENV>",
  "python_version": "<sys.version>"
}
```
**HTTP Status**: 200

**Error scenarios**: None — reads from env vars with safe defaults.

---

## Global Error Handling

Powertools `ApiGatewayResolver` handles errors at the framework level:

| Scenario | HTTP Status | Response body |
|---|---|---|
| No route matched | 404 | `{"statusCode": 404, "message": "Not found"}` |
| `BadRequestError` raised in handler | 400 | `{"statusCode": 400, "message": "<error message>"}` |
| Unhandled exception in handler | 500 | `{"statusCode": 500, "message": "Internal Server Error"}` — no stack trace |

**SECURITY-15 compliance**: Unhandled exceptions are caught by Powertools before reaching the caller. The 500 response body contains only a generic message — no internal details, file paths, or stack traces are exposed.

---

## Logging Model

Every request emits a structured JSON log entry via Powertools Logger:

```json
{
  "level": "INFO",
  "location": "main.handler:12",
  "message": "Request received",
  "service": "flask-lambda-api",
  "timestamp": "2026-08-28T00:00:00.000Z",
  "xray_trace_id": "...",
  "cold_start": true,
  "function_request_id": "...",
  "path": "/hello/World",
  "method": "GET"
}
```

Sensitive data rules (SECURITY-03):
- No request body contents logged
- No environment variable values logged
- No stack traces in log output
