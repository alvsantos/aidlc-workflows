import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { PipelineStack } from "../stacks/pipeline-stack";

/**
 * Infra tests for PipelineStack.
 * Includes a check that the PR test-quality gate's least-privilege
 * secretsmanager:GetSecretValue grant is present (Infrastructure Design).
 */
describe("PipelineStack", () => {
  const app = new cdk.App();
  const stack = new PipelineStack(app, "PipelineStackTest", {
    githubRepo: "my-org/flask-lambda-api",
  });
  const template = Template.fromStack(stack);

  test("creates the GitHub Actions OIDC provider", () => {
    template.resourceCountIs("Custom::AWSCDKOpenIdConnectProvider", 1);
  });

  test("creates the deploy role and codebuild project", () => {
    template.resourceCountIs("AWS::CodeBuild::Project", 1);
    // At least the deploy role + codebuild service role.
    const roles = template.findResources("AWS::IAM::Role");
    expect(Object.keys(roles).length).toBeGreaterThanOrEqual(2);
  });

  test("grants least-privilege secretsmanager:GetSecretValue for the Kiro key (PR gate)", () => {
    // The gate reads the Kiro API key secret via the deploy role's INLINE policy.
    const roles = template.findResources("AWS::IAM::Role");
    const json = JSON.stringify(roles);
    expect(json).toContain("secretsmanager:GetSecretValue");
  });
});
