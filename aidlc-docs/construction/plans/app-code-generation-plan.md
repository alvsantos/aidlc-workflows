# Code Generation Plan — Unit: app

## Unit Context

- **Unit**: app (Python REST API)
- **Stories**: S-01, S-02, S-03, S-04, S-05
- **Target directory**: `app/` (workspace root — never aidlc-docs/)
- **Tech stack**: Python 3.11, AWS Lambda Powertools 2.x, pytest, flake8
- **Entry point**: `app/main.py` → `handler(event, context)`
- **Dependencies on other units**: None — app is the first unit

---

## Step 1: Project Structure Setup
- [x] Create `app/` directory
- [x] Create `app/main.py` (Lambda handler + all route controllers)
- [x] Create `app/requirements.txt` (pinned runtime dependencies)
- [x] Create `app/requirements-dev.txt` (pinned dev/test dependencies)
- [x] Create `app/tests/` directory
- [x] Create `app/tests/__init__.py` (empty — marks tests as package)
- [x] Create `app/tests/test_main.py` (unit tests)

**Stories covered by this step**: S-01, S-02, S-03, S-04, S-05

---

## Step 2: Business Logic Generation — `app/main.py`
- [x] Import Powertools Logger, Tracer, ApiGatewayResolver
- [x] Module-level constants: `ENV`, `APP_VERSION`, `LOG_LEVEL` from `os.environ.get()`
- [x] Module-level instances: `logger`, `tracer`, `app` (ApiGatewayResolver)
- [x] Compiled regex constant: `NAME_PATTERN`
- [x] Private validator: `_validate_name(name: str) -> None`
- [x] Global exception handler registered on `app`
- [x] `GET /health` handler → `get_health()` (S-01)
- [x] `GET /hello/<name>` handler → `get_hello(name)` with validation (S-02)
- [x] `GET /version` handler → `get_version()` (S-03)
- [x] `handler(event, context)` Lambda entry point with `@logger.inject_lambda_context(log_event=False)` (S-05)

---

## Step 3: Business Logic Unit Testing — `app/tests/test_main.py`
- [x] Import `pytest` and test utilities
- [x] Helper: `build_event(method, path, pathParameters=None)` — constructs mock API GW HTTP API event
- [x] Test `GET /health` → 200 + correct body (S-01)
- [x] Test `GET /hello/World` → 200 + `{"message": "Hello, World!"}` (S-02)
- [x] Test `GET /hello/<name>` with empty name → 400 (S-02, BR-02)
- [x] Test `GET /hello/<name>` with name > 50 chars → 400 (S-02, BR-02)
- [x] Test `GET /hello/<name>` with invalid chars (e.g. `<script>`) → 400 (S-02, BR-01)
- [x] Test `GET /version` → 200 + keys `version`, `environment`, `python_version` present (S-03)
- [x] Test unmatched route → 404 (global routing)

---

## Step 4: Business Logic Summary
- [x] Create `aidlc-docs/construction/app/code/business-logic-summary.md` with list of generated files and test coverage

---

## Step 5: Dependencies Generation
- [x] Write `app/requirements.txt` with exact pinned versions
- [x] Write `app/requirements-dev.txt` with exact pinned dev versions

---

## Step 6: Documentation Generation
- [x] Create `app/README.md` with local dev setup, how to run tests, how to run linter

---

## Story Traceability

| Story | Implemented in step |
|---|---|
| S-01: GET /health | Step 2, Step 3 |
| S-02: GET /hello/{name} with validation | Step 2, Step 3 |
| S-03: GET /version | Step 2, Step 3 |
| S-04: Unit tests (pytest) | Step 3 |
| S-05: Structured logging | Step 2 |
