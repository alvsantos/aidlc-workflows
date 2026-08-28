# Logical Components — Unit: infra

## AWS Resources Provisioned by AppStack

### Lambda Function (`flask-lambda-api-{envName}`)
- **Type**: AWS Lambda function
- **Runtime**: Python 3.11
- **Code**: Bundled from `app/` directory at CDK synth time
- **Config**: memory, timeout, env vars, execution role all explicitly defined

### CloudWatch Log Group — Lambda (`/aws/lambda/flask-lambda-api-{envName}`)
- **Type**: CloudWatch Logs Log Group
- **Retention**: 7 days (dev) / 30 days (prod)
- **Created before Lambda**: ensures retention is set from the first invocation

### IAM Execution Role (`LambdaExecutionRole`)
- **Type**: IAM Role
- **Trust**: `lambda.amazonaws.com`
- **Permissions**: `AWSLambdaBasicExecutionRole` only

### API Gateway HTTP API
- **Type**: Amazon API Gateway HTTP API (v2)
- **Integration**: Lambda proxy (`ANY /{proxy+}`)
- **Stage**: `dev` or `prod` with auto-deploy enabled
- **Throttling**: 100 RPS rate limit, 50 burst (demo safeguard)
- **Access logs**: enabled to dedicated log group

### CloudWatch Log Group — API Gateway (`/aws/apigateway/flask-lambda-api-{envName}`)
- **Type**: CloudWatch Logs Log Group
- **Retention**: same as Lambda log group (env-specific)

### CloudFormation Outputs
- `ApiUrl`: full invoke URL including stage
- `LambdaFunctionArn`: ARN for reference
- `EnvironmentName`: the `envName` value
