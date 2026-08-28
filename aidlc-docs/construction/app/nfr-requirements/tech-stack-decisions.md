# Tech Stack Decisions — Unit: app

## Runtime

| Component | Choice | Version | Rationale |
|---|---|---|---|
| Language | Python | 3.11 | LTS, supported Lambda runtime, good Powertools support |
| Lambda runtime | `python3.11` | — | Matches local dev version; fast cold start |

## Framework & Libraries

| Library | Version (pinned) | Purpose | Alternatives considered |
|---|---|---|---|
| `aws-lambda-powertools` | `2.x` (latest 2.x stable) | API routing (`ApiGatewayResolver`), structured logging (`Logger`), tracing (`Tracer`) | Mangum + Flask: rejected — adds extra dependency, Powertools natively handles API GW events |
| `pytest` | `7.x` (latest 7.x stable) | Unit testing framework | unittest: rejected — pytest fixtures and parametrise are more ergonomic |
| `flake8` | `6.x` (latest 6.x stable) | PEP 8 linting | ruff: valid alternative but flake8 is more universally known |

## Why Powertools over Mangum + Flask

| Dimension | Powertools `ApiGatewayResolver` | Mangum + Flask |
|---|---|---|
| Dependencies | 1 (powertools) | 2 (mangum + flask) |
| Lambda-native | Yes — designed for Lambda event shapes | No — Mangum adapts WSGI to Lambda |
| Structured logging | Built-in | Requires separate setup |
| Tracing (X-Ray) | Built-in decorator | Requires separate AWS X-Ray SDK |
| Input validation | `BadRequestError` built-in | Manual or Flask-specific extensions |
| Cold start | Lighter — no WSGI stack | Slightly heavier |
| **Decision** | ✅ **Chosen** | Rejected |

## Packaging

| Aspect | Decision | Rationale |
|---|---|---|
| Deployment format | Zip artifact (CDK asset bundling) | Simpler than container image; sufficient for this project's size |
| Bundling tool | CDK `BundlingOptions` with `pip install -r requirements.txt -t /asset-output` | Standard CDK Python Lambda bundling pattern |
| Asset directory | `../app` relative to `infra/` | Clean separation of app and IaC code |

## Dev Dependencies (not in runtime requirements.txt)

| Library | Purpose |
|---|---|
| `pytest` | Unit tests |
| `flake8` | Linting |
| `pytest-cov` | Coverage reporting (optional) |
