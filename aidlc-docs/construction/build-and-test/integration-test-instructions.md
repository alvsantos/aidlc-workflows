# Integration Test Instructions

Integration tests validate the deployed system end-to-end — real Lambda + API Gateway + CloudWatch Logs.

## Prerequisites

- `AppStack-dev` deployed (`npm run deploy:dev` from `infra/`)
- AWS CLI configured with read permissions
- `API_URL` available from CloudFormation outputs

---

## Step 1: Get the API URL

```bash
API_URL=$(aws cloudformation describe-stacks \
  --stack-name AppStack-dev \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)

echo "API URL: $API_URL"
# Expected: https://xyz.execute-api.us-east-1.amazonaws.com/dev
```

---

## Step 2: Test GET /health

```bash
curl -s "$API_URL/health" | python3 -m json.tool

# Expected:
# {
#     "status": "ok",
#     "environment": "dev"
# }
```

---

## Step 3: Test GET /hello/{name}

```bash
# Happy path
curl -s "$API_URL/hello/World" | python3 -m json.tool
# Expected: {"message": "Hello, World!"}

# Parameterised
curl -s "$API_URL/hello/Arthur" | python3 -m json.tool
# Expected: {"message": "Hello, Arthur!"}

# Input validation — invalid characters (should return 400)
curl -s -o /dev/null -w "%{http_code}" "$API_URL/hello/<script>"
# Expected: 400

# Input validation — too long (should return 400)
curl -s -o /dev/null -w "%{http_code}" "$API_URL/hello/$(python3 -c 'print("A"*51)')"
# Expected: 400
```

---

## Step 4: Test GET /version

```bash
curl -s "$API_URL/version" | python3 -m json.tool

# Expected:
# {
#     "version": "0.1.0",
#     "environment": "dev",
#     "python_version": "3.11.x ..."
# }
```

---

## Step 5: Test 404 routing

```bash
curl -s -o /dev/null -w "%{http_code}" "$API_URL/nonexistent"
# Expected: 404
```

---

## Step 6: Verify CloudWatch Logs

Confirm structured JSON logs are being written:

```bash
LOG_GROUP="/aws/lambda/flask-lambda-api-dev"

# Get the latest log stream
STREAM=$(aws logs describe-log-streams \
  --log-group-name "$LOG_GROUP" \
  --order-by LastEventTime \
  --descending \
  --query "logStreams[0].logStreamName" \
  --output text)

# Get recent log events
aws logs get-log-events \
  --log-group-name "$LOG_GROUP" \
  --log-stream-name "$STREAM" \
  --limit 5 \
  --query "events[*].message" \
  --output text

# Expected: JSON log entries with service, level, timestamp, cold_start fields
```

---

## Step 7: Verify API Gateway Access Logs

```bash
ACCESS_LOG_GROUP="/aws/apigateway/flask-lambda-api-dev"

STREAM=$(aws logs describe-log-streams \
  --log-group-name "$ACCESS_LOG_GROUP" \
  --order-by LastEventTime \
  --descending \
  --query "logStreams[0].logStreamName" \
  --output text)

aws logs get-log-events \
  --log-group-name "$ACCESS_LOG_GROUP" \
  --log-stream-name "$STREAM" \
  --limit 3 \
  --query "events[*].message" \
  --output text

# Expected: JSON entries with requestId, sourceIp, httpMethod, routeKey, status, responseLatency
```

---

## Integration Test Checklist

- [ ] `GET /health` returns 200 with `{"status": "ok", "environment": "dev"}`
- [ ] `GET /hello/World` returns 200 with `{"message": "Hello, World!"}`
- [ ] `GET /hello/<script>` returns 400
- [ ] `GET /hello/<51-char name>` returns 400
- [ ] `GET /version` returns 200 with `version`, `environment`, `python_version`
- [ ] `GET /nonexistent` returns 404
- [ ] Lambda CloudWatch Logs contain structured JSON entries
- [ ] API Gateway access logs contain structured JSON entries
- [ ] No stack traces visible in any API response
