# Business Rules — Unit: app

## BR-01: name parameter — character allowlist

**Applies to**: `GET /hello/{name}`
**Rule**: The `name` path parameter MUST only contain alphanumeric characters, spaces, underscores, and hyphens.
**Regex**: `^[a-zA-Z0-9 _\-]+$`
**Violation response**: HTTP 400, `{"statusCode": 400, "message": "Invalid name parameter"}`
**Rationale**: Prevents XSS and script injection via the name field (SECURITY-05).

---

## BR-02: name parameter — length constraint

**Applies to**: `GET /hello/{name}`
**Rule**: The `name` path parameter MUST be between 1 and 50 characters (inclusive).
**Violation (empty/whitespace)**: HTTP 400, `{"statusCode": 400, "message": "Invalid name parameter"}`
**Violation (>50 chars)**: HTTP 400, `{"statusCode": 400, "message": "Invalid name parameter"}`
**Rationale**: Prevents trivially large payloads and ensures meaningful names (SECURITY-05, NFR-02).

---

## BR-03: Environment variable defaults

**Applies to**: `GET /health`, `GET /version`
**Rule**: If `ENV` or `APP_VERSION` environment variables are not set, the API MUST return safe default values (`"unknown"` and `"0.1.0"` respectively) rather than raising an error.
**Rationale**: Prevents Lambda cold-start failures if CDK stack misconfigures env vars.

---

## BR-04: No sensitive data in responses

**Applies to**: All endpoints
**Rule**: HTTP error responses MUST NOT include stack traces, internal file paths, framework versions, or AWS infrastructure details.
**Complies with**: SECURITY-09, SECURITY-15
**Implementation**: Powertools `ApiGatewayResolver` catches unhandled exceptions and returns a generic 500 message.

---

## BR-05: No sensitive data in logs

**Applies to**: All log output
**Rule**: Lambda Powertools Logger MUST NOT log request body contents, environment variable values, or exception stack frames that expose internal paths.
**Complies with**: SECURITY-03
**Implementation**: Log only: request method, path, status code, request ID, cold start flag.

---

## BR-06: Stateless operation

**Applies to**: All endpoints
**Rule**: The API MUST NOT maintain any in-memory state between Lambda invocations. Each invocation is independent.
**Rationale**: Lambda execution environments are ephemeral and may be recycled; stateful behaviour would be unreliable.
