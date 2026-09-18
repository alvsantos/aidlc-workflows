#!/usr/bin/env node
/**
 * CDK App entry point — flask-lambda-api infrastructure
 *
 * Usage:
 *   npx cdk deploy AppStack-dev  --context envName=dev
 *   npx cdk deploy AppStack-prod --context envName=prod
 *
 * The envName context value is required. Pass it via:
 *   1. --context envName=dev|prod  (pipeline and explicit deploys)
 *   2. "envName": "dev" in cdk.json context section  (local dev fallback)
 */

import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AppStack } from "./stacks/app-stack";
import { PipelineStack } from "./stacks/pipeline-stack";

const app = new cdk.App();

// ---------------------------------------------------------------------------
// Read and validate envName context (BR-INFRA-01)
// ---------------------------------------------------------------------------
const envName: string | undefined = app.node.tryGetContext("envName");

if (!envName) {
  throw new Error(
    "Required CDK context key 'envName' is not set.\n" +
    "Pass it via: --context envName=dev  or  --context envName=prod\n" +
    "Or set a default in cdk.json under 'context.envName'."
  );
}

// ---------------------------------------------------------------------------
// Instantiate stacks
// ---------------------------------------------------------------------------

if (envName === "pipeline") {
  // PipelineStack — bootstrap-once CI/CD infrastructure (BR-PIPE-07)
  // Deploy with: npx cdk deploy PipelineStack --context envName=pipeline --context githubRepo=owner/repo
  const githubRepo: string | undefined = app.node.tryGetContext("githubRepo");
  if (!githubRepo) {
    throw new Error(
      "Required CDK context key 'githubRepo' is not set when envName=pipeline.\n" +
      "Pass it via: --context githubRepo=owner/repo\n" +
      "Example: --context githubRepo=my-org/flask-lambda-api"
    );
  }

  new PipelineStack(app, "PipelineStack", {
    githubRepo,
    // Optional: ARN of the Secrets Manager secret holding the Kiro CLI API key
    // used by the PR test-quality gate. Pass via --context kiroSecretArn=...
    // If omitted, PipelineStack scopes to "pr-gate/kiro-api-key-*" in this account/region.
    kiroSecretArn: app.node.tryGetContext("kiroSecretArn"),
    description: "CI/CD infrastructure: CodeBuild runner, OIDC provider, IAM deploy role",
    tags: {
      Project: "flask-lambda-api",
      ManagedBy: "CDK",
    },
  });
} else {
  // AppStack for the specified environment (dev or prod)
  // Stack ID includes envName to ensure distinct CloudFormation stack names (BR-INFRA-03)
  new AppStack(app, `AppStack-${envName}`, {
    envName,
    description: `Flask Lambda API infrastructure — ${envName} environment`,
    tags: {
      Environment: envName,
      Project: "flask-lambda-api",
      ManagedBy: "CDK",
    },
  });
}
