# Unit Test Execution

## Test Suite Overview

| Unit | Framework | Test file | Test count |
|---|---|---|---|
| `app` | pytest 7.4.4 | `app/tests/test_main.py` | 19 |
| `infra` | N/A — CDK validated via `cdk synth` | — | — |
| `pipeline` | N/A — YAML validated via GitHub Actions linter | — | — |

---

## Run All Unit Tests

```bash
cd app

# Activate virtual environment
source .venv/bin/activate

# Run all tests with verbose output
pytest tests/ -v

# Expected output:
# tests/test_main.py::TestHealthEndpoint::test_health_returns_200 PASSED
# tests/test_main.py::TestHealthEndpoint::test_health_returns_status_ok PASSED
# tests/test_main.py::TestHealthEndpoint::test_health_returns_environment PASSED
# tests/test_main.py::TestHelloEndpoint::test_hello_valid_name_returns_200 PASSED
# ...
# 19 passed in X.XXs
```

---

## Run with Coverage Report

```bash
pytest tests/ -v --cov=. --cov-report=term-missing --cov-omit=tests/*

# Expected: all 3 endpoints covered
# Lines not covered: exception handler (requires forced exception injection)
```

---

## Test Descriptions

### TestHealthEndpoint (3 tests)
| Test | Verifies |
|---|---|
| `test_health_returns_200` | HTTP 200 status |
| `test_health_returns_status_ok` | `{"status": "ok"}` in response body |
| `test_health_returns_environment` | `environment` key present in response |

### TestHelloEndpoint (10 tests)
| Test | Verifies |
|---|---|
| `test_hello_valid_name_returns_200` | Happy path — HTTP 200 |
| `test_hello_valid_name_returns_greeting` | `{"message": "Hello, Alice!"}` |
| `test_hello_name_with_hyphen_is_valid` | Hyphens in allowlist (BR-01) |
| `test_hello_empty_name_returns_400` | Empty string → 400 (BR-02) |
| `test_hello_whitespace_only_name_returns_400` | Whitespace only → 400 (BR-02) |
| `test_hello_name_too_long_returns_400` | 51 chars → 400 (BR-02) |
| `test_hello_name_exactly_50_chars_is_valid` | 50 chars → 200 (boundary, BR-02) |
| `test_hello_script_tag_in_name_returns_400` | XSS attempt → 400 (BR-01, SECURITY-05) |
| `test_hello_sql_injection_in_name_returns_400` | SQL injection → 400 (BR-01, SECURITY-05) |
| `test_hello_error_response_does_not_reflect_input` | Error body never contains the invalid value (SECURITY-09) |

### TestVersionEndpoint (3 tests)
| Test | Verifies |
|---|---|
| `test_version_returns_200` | HTTP 200 status |
| `test_version_returns_required_fields` | `version`, `environment`, `python_version` present |
| `test_version_values_are_strings` | All fields are strings |

### TestRouting (2 tests)
| Test | Verifies |
|---|---|
| `test_unmatched_route_returns_404` | Unknown path → 404 |
| `test_post_to_health_returns_404` | POST to GET-only route → 404 |

---

## IaC Validation (in place of infra unit tests)

```bash
cd infra
npm run synth:dev   # Validates AppStack-dev compiles to valid CloudFormation
npm run synth:prod  # Validates AppStack-prod
npx cdk synth PipelineStack --context envName=pipeline --context githubRepo=owner/repo
# Expected: exit code 0, no errors
```
