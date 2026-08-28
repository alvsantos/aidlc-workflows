# Code Summary — Unit: app

## Generated Files

### Application Code (`app/`)

| File | Purpose | Stories |
|---|---|---|
| `app/main.py` | Lambda handler + all route controllers + input validator + Powertools config | S-01, S-02, S-03, S-05 |
| `app/requirements.txt` | Pinned runtime dependency (`aws-lambda-powertools==2.43.1`) | S-04 (reproducibility) |
| `app/requirements-dev.txt` | Pinned dev deps (`pytest`, `flake8`, `pytest-cov`) | S-04 |
| `app/README.md` | Local dev setup, test instructions, env var reference | — |

### Tests (`app/tests/`)

| File | Test classes | Test count |
|---|---|---|
| `app/tests/test_main.py` | `TestHealthEndpoint`, `TestHelloEndpoint`, `TestVersionEndpoint`, `TestRouting` | 19 |
| `app/tests/__init__.py` | (empty package marker) | — |

## Test Coverage Summary

| Endpoint | Happy Path | Validation Failures | Security Assertions |
|---|---|---|---|
| `GET /health` | ✅ 200 + body shape | N/A | — |
| `GET /hello/<name>` | ✅ 200 + greeting | ✅ empty, whitespace, >50 chars, boundary=50 | ✅ `<script>`, SQL injection, error body doesn't reflect input |
| `GET /version` | ✅ 200 + 3 fields | N/A | — |
| Unmatched route | ✅ 404 | ✅ POST to registered path | — |

**Total tests: 19**

## Security Compliance (Code Generation stage)

| Rule | Compliance | Implementation |
|---|---|---|
| SECURITY-03 | ✅ | `@logger.inject_lambda_context(log_event=False)` — raw event never logged |
| SECURITY-05 | ✅ | `_validate_name()` with compiled allowlist regex + length check |
| SECURITY-09 | ✅ | `handle_generic_exception()` returns generic 500; error body never reflects input |
| SECURITY-10 | ✅ | Exact version pins in both requirements files |
| SECURITY-15 | ✅ | `@app.exception_handler(Exception)` catches all unhandled exceptions; `logger.exception()` sends trace to CloudWatch only |
| Others | N/A | Not applicable at app layer |
