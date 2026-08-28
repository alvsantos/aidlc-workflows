# Build Instructions

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Python | 3.11+ | [python.org](https://www.python.org/downloads/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| npm | 9+ | Bundled with Node.js |
| AWS CLI | v2 | `brew install awscli` / [docs](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) |
| AWS CDK CLI | 2.143.0 | `npm install -g aws-cdk@2.143.0` |
| Docker | Latest | Required for CDK asset bundling (pip install in Lambda zip) |

**Note**: Docker must be running when executing `cdk synth` or `cdk deploy` — CDK uses it to bundle the Python Lambda zip.

---

## Environment Variables

Set these in your shell or `~/.aws/credentials` before building:

```bash
export AWS_DEFAULT_REGION=us-east-1
# For local deploy — use AWS SSO or IAM credentials
# In CI/CD — OIDC handles credentials automatically (no env vars needed)
```

---

## Build Steps — Unit: app

### 1. Create and activate virtual environment

```bash
cd app
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
```

### 2. Install dev dependencies

```bash
pip install -r requirements-dev.txt
```

### 3. Verify linting passes

```bash
flake8 . --max-line-length=100 --exclude=tests
# Expected: no output (zero violations)
```

### 4. Verify tests pass

```bash
pytest tests/ -v
# Expected: 19 passed, 0 failed
```

---

## Build Steps — Unit: infra

### 1. Install dependencies

```bash
cd infra
npm ci
# Uses package-lock.json exactly — no version drift
```

### 2. Compile TypeScript

```bash
npm run build
# Expected: no errors, dist/ directory populated
```

### 3. Synthesise CDK app (dev)

```bash
npm run synth:dev
# Equivalent to: npx cdk synth --context envName=dev
# Expected: cdk.out/ directory with CloudFormation template
# Note: Docker must be running for Lambda asset bundling
```

### 4. Synthesise CDK app (prod)

```bash
npm run synth:prod
# Expected: cdk.out/ with prod CloudFormation template
```

### Verify Build Artifacts

After `cdk synth`, verify the following exist:

```
infra/cdk.out/
├── AppStack-dev.template.json     ← dev CloudFormation template
├── AppStack-prod.template.json    ← prod CloudFormation template
└── asset.<hash>/                  ← bundled Lambda zip directory
    ├── main.py
    ├── requirements.txt
    └── aws_lambda_powertools/     ← installed Powertools package
```

---

## Common Build Errors

### `Docker daemon not running`
- **Cause**: CDK asset bundling requires Docker to install Python packages
- **Fix**: Start Docker Desktop (or `sudo systemctl start docker` on Linux)

### `Cannot find module './stacks/pipeline-stack'`
- **Cause**: TypeScript not compiled yet
- **Fix**: `npm run build` in `infra/`

### `envName context is required`
- **Cause**: CDK context key not set
- **Fix**: Pass `--context envName=dev` or `--context envName=prod`

### `pytest: command not found`
- **Cause**: Virtual environment not activated
- **Fix**: `source app/.venv/bin/activate`
