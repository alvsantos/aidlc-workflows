import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Construct } from "constructs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AppStackProps extends cdk.StackProps {
  /** Deployment environment: "dev" or "prod" */
  envName: string;
}

//New comment
interface EnvConfig {
  memorySize: number;
  logRetention: logs.RetentionDays;
  logLevel: string;
  traceDisabled: string;
  removalPolicy: cdk.RemovalPolicy;
  throttleRateLimit: number;
  throttleBurstLimit: number;
}

// ---------------------------------------------------------------------------
// Environment configuration (single source of truth — BR-INFRA-01/02)
// ---------------------------------------------------------------------------

function resolveConfig(envName: string): EnvConfig {
  const configs: Record<string, EnvConfig> = {
    dev: {
      memorySize: 128,
      logRetention: logs.RetentionDays.ONE_WEEK,
      logLevel: "DEBUG",
      traceDisabled: "true",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      throttleRateLimit: 100,
      throttleBurstLimit: 50,
    },
    prod: {
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_MONTH,
      logLevel: "INFO",
      traceDisabled: "false",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      throttleRateLimit: 100,
      throttleBurstLimit: 50,
    },
  };

  const config = configs[envName];
  if (!config) {
    throw new Error(
      `Unknown envName: "${envName}". Must be "dev" or "prod". (BR-INFRA-02)`
    );
  }
  return config;
}

// ---------------------------------------------------------------------------
// AppStack
// ---------------------------------------------------------------------------

export class AppStack extends cdk.Stack {
  /** Public API URL — emitted as CloudFormation output */
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const { envName } = props;
    const config = resolveConfig(envName);

    // Step 1: Log groups (pre-created so retention applies from first invocation)
    const { lambdaLogGroup, apiAccessLogGroup } = this._createLogGroups(
      envName,
      config
    );

    // Step 2: IAM execution role (least-privilege — SECURITY-06, BR-INFRA-04)
    const executionRole = this._createExecutionRole();

    // Step 3: Lambda function
    const fn = this._createLambdaFunction(
      envName,
      executionRole,
      lambdaLogGroup,
      config
    );

    // Step 4: API Gateway HTTP API
    const httpApi = this._createHttpApi(
      envName,
      fn,
      apiAccessLogGroup,
      config
    );

    // Step 5: CloudFormation outputs
    this._createOutputs(httpApi, fn, envName);

    // Store for external reference
    this.apiUrl = httpApi.apiEndpoint;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Pre-create log groups with explicit retention policies.
   * Without pre-creation, Lambda auto-creates log groups with no retention
   * policy, leading to unbounded log storage cost. (BR-INFRA-05)
   */
  private _createLogGroups(
    envName: string,
    config: EnvConfig
  ): {
    lambdaLogGroup: logs.LogGroup;
    apiAccessLogGroup: logs.LogGroup;
  } {
    const lambdaLogGroup = new logs.LogGroup(this, "LambdaLogGroup", {
      logGroupName: `/aws/lambda/flask-lambda-api-${envName}`,
      retention: config.logRetention,
      removalPolicy: config.removalPolicy,
    });

    // Separate log group for API Gateway access logs (SECURITY-02, BR-INFRA-06)
    const apiAccessLogGroup = new logs.LogGroup(this, "ApiAccessLogGroup", {
      logGroupName: `/aws/apigateway/flask-lambda-api-${envName}`,
      retention: config.logRetention,
      removalPolicy: config.removalPolicy,
    });

    return { lambdaLogGroup, apiAccessLogGroup };
  }

  /**
   * Create a least-privilege IAM execution role for the Lambda function.
   * Only AWSLambdaBasicExecutionRole (CloudWatch Logs write).
   * No additional permissions — stateless API makes no AWS API calls. (SECURITY-06, BR-INFRA-04)
   */
  private _createExecutionRole(): iam.Role {
    return new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      description:
        "Least-privilege execution role for flask-lambda-api — CloudWatch Logs write only",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });
  }

  /**
   * Create the Lambda function with Python 3.11 runtime and CDK asset bundling.
   * The app/ directory is bundled at cdk synth time using Docker pip install.
   * Explicit log group reference prevents CDK from creating a permissive one.
   */
  private _createLambdaFunction(
    envName: string,
    role: iam.Role,
    logGroup: logs.LogGroup,
    config: EnvConfig
  ): lambda.Function {
    const fn = new lambda.Function(this, "ApiFunction", {
      functionName: `flask-lambda-api-${envName}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: "main.handler",
      // Bundle app/ directory: pip install -r requirements.txt into the zip
      code: lambda.Code.fromAsset(path.join(__dirname, "../../app"), {
        bundling: {
          image: lambda.Runtime.PYTHON_3_11.bundlingImage,
          command: [
            "bash",
            "-c",
            "pip install -r requirements.txt -t /asset-output && cp -r . /asset-output",
          ],
        },
      }),
      role,
      memorySize: config.memorySize,
      timeout: cdk.Duration.seconds(30), // Explicit timeout — BR-INFRA-08
      logGroup, // Pre-created log group with retention
      environment: {
        ENV: envName,
        APP_VERSION: "0.1.0",
        LOG_LEVEL: config.logLevel,
        POWERTOOLS_SERVICE_NAME: "flask-lambda-api",
        POWERTOOLS_TRACE_DISABLED: config.traceDisabled,
      },
    });

    return fn;
  }

  /**
   * Create the HTTP API Gateway with Lambda proxy integration and access logging.
   * HTTP API chosen over REST API: lower cost ($1/M vs $3.50/M), lower latency.
   * Access logging is configured via CfnStage escape hatch (CDK L2 HttpStageOptions
   * does not expose accessLogSettings directly). (SECURITY-02, BR-INFRA-06)
   */
  private _createHttpApi(
    envName: string,
    fn: lambda.Function,
    accessLogGroup: logs.LogGroup,
    config: EnvConfig
  ): apigwv2.HttpApi {
    const integration = new integrations.HttpLambdaIntegration(
      "LambdaIntegration",
      fn
    );

    const httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: `flask-lambda-api-${envName}`,
      description: `HTTP API for flask-lambda-api (${envName})`,
      defaultIntegration: integration,
      // Disable default stage — we create it explicitly to control access logging
      createDefaultStage: false,
    });

    const stage = httpApi.addStage("DefaultStage", {
      stageName: envName,
      autoDeploy: true,
      throttle: {
        rateLimit: config.throttleRateLimit,
        burstLimit: config.throttleBurstLimit,
      },
    });

    // Configure access logging via CfnStage escape hatch — CDK L2 HttpStageOptions
    // does not expose accessLogSettings in this CDK version. (SECURITY-02)
    const cfnStage = stage.node.defaultChild as apigwv2.CfnStage;
    cfnStage.accessLogSettings = {
      destinationArn: accessLogGroup.logGroupArn,
      format: JSON.stringify({
        requestId: "$context.requestId",
        sourceIp: "$context.identity.sourceIp",
        requestTime: "$context.requestTime",
        httpMethod: "$context.httpMethod",
        routeKey: "$context.routeKey",
        status: "$context.status",
        protocol: "$context.protocol",
        responseLatency: "$context.responseLatency",
        userAgent: "$context.identity.userAgent",
      }),
    };

    return httpApi;
  }

  /**
   * Emit CloudFormation outputs for the API URL and Lambda ARN.
   * ApiUrl is used by the pipeline for smoke tests and by developers.
   */
  private _createOutputs(
    api: apigwv2.HttpApi,
    fn: lambda.Function,
    envName: string
  ): void {
    new cdk.CfnOutput(this, "ApiUrl", {
      value: `${api.apiEndpoint}/${envName}`,
      description: `API invoke URL for environment: ${envName}`,
      exportName: `flask-lambda-api-url-${envName}`,
    });

    new cdk.CfnOutput(this, "LambdaFunctionArn", {
      value: fn.functionArn,
      description: "Lambda function ARN",
      exportName: `flask-lambda-api-arn-${envName}`,
    });

    new cdk.CfnOutput(this, "EnvironmentName", {
      value: envName,
      description: "Deployed environment name",
    });
  }
}
