import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import { Construct } from "constructs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PipelineStackProps extends cdk.StackProps {
  /**
   * GitHub repository in "owner/repo" format.
   * Example: "my-org/flask-lambda-api"
   * Used to scope the OIDC trust policy to this specific repo (BR-PIPE-02).
   */
  githubRepo: string;
}

// ---------------------------------------------------------------------------
// PipelineStack — Bootstrap-once CI/CD infrastructure (BR-PIPE-07)
//
// Deploy this stack ONCE before configuring GitHub Actions:
//   npx cdk deploy PipelineStack --context envName=pipeline \
//       --context githubRepo=owner/repo
//
// After deployment, note the outputs:
//   DeployRoleArn     → set as GitHub Actions variable AWS_ROLE_ARN
//   CodeBuildProjectName → configure GitHub Actions CodeBuild runner
// ---------------------------------------------------------------------------

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const { githubRepo } = props;

    // Step 1: OIDC Identity Provider for GitHub Actions (S-12)
    const oidcProvider = this._createOidcProvider();

    // Step 2: IAM role assumed by GitHub Actions via OIDC (S-12, BR-PIPE-01/02)
    const deployRole = this._createDeployRole(oidcProvider, githubRepo);

    // Step 3: CodeBuild service role (S-13)
    const codeBuildRole = this._createCodeBuildRole(deployRole);

    // Step 4: CodeBuild project as GitHub Actions runner (S-13)
    const project = this._createCodeBuildProject(codeBuildRole, githubRepo);

    // Step 5: Outputs
    this._createOutputs(deployRole, project);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Register GitHub Actions OIDC provider.
   * This is typically created once per AWS account — CDK will skip if it already exists.
   * Thumbprint is the SHA1 of the GitHub OIDC root CA certificate.
   */
  private _createOidcProvider(): iam.OpenIdConnectProvider {
    return new iam.OpenIdConnectProvider(this, "GitHubOidcProvider", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
      // Thumbprint for token.actions.githubusercontent.com root CA
      // See: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc_verify-thumbprint.html
      thumbprints: ["6938fd4d98bab03faadb97b34396831e3780aea1"],
    });
  }

  /**
   * Create the IAM role assumed by GitHub Actions via OIDC.
   *
   * Trust policy is scoped to the specific GitHub repo (BR-PIPE-02, SECURITY-06):
   *   - sub: repo:{owner}/{repo}:*  (any ref in this repo)
   *   - aud: sts.amazonaws.com
   *
   * Permissions: sts:AssumeRole on CDK bootstrap roles only (least-privilege).
   * CDK bootstrap roles are named "cdk-*" in the target account.
   */
  private _createDeployRole(
    provider: iam.OpenIdConnectProvider,
    githubRepo: string
  ): iam.Role {
    const role = new iam.Role(this, "GitHubActionsDeployRole", {
      roleName: "GitHubActionsDeployRole",
      description:
        "Assumed by GitHub Actions via OIDC to deploy CDK stacks. Scoped to a single repo.",
      assumedBy: new iam.WebIdentityPrincipal(
        provider.openIdConnectProviderArn,
        {
          // Audience must be sts.amazonaws.com
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          // Use job_workflow_ref for reusable workflow OIDC — more reliable than sub claim
          // which varies based on pull_request vs push event context.
          StringLike: {
            "token.actions.githubusercontent.com:sub":
              `repo:${githubRepo}:*`,
            "token.actions.githubusercontent.com:job_workflow_ref":
              `${githubRepo}/.github/workflows/deploy.yml@*`,
          },
        }
      ),
      // Inline policy: allow assuming CDK bootstrap execution roles
      // CDK deploy needs: cdk-cfn-exec-role, cdk-deploy-role, cdk-lookup-role, cdk-asset-publishing-role
      inlinePolicies: {
        CdkDeployPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: "AllowCdkBootstrapRoleAssumption",
              effect: iam.Effect.ALLOW,
              actions: ["sts:AssumeRole"],
              // Scoped to CDK bootstrap roles in this account (least-privilege — SECURITY-06)
              resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
            }),
            new iam.PolicyStatement({
              sid: "AllowCdkBootstrapVersionCheck",
              effect: iam.Effect.ALLOW,
              actions: ["ssm:GetParameter"],
              // CDK reads this SSM parameter to verify bootstrap stack version
              resources: [`arn:aws:ssm:*:${this.account}:parameter/cdk-bootstrap/*/version`],
            }),
          ],
        }),
      },
    });

    return role;
  }

  /**
   * Create the IAM service role for the CodeBuild project.
   * Needs permissions to run builds and to assume the GitHub Actions deploy role.
   */
  private _createCodeBuildRole(deployRole: iam.Role): iam.Role {
    const role = new iam.Role(this, "CodeBuildServiceRole", {
      roleName: "CodeBuildGitHubRunnerRole",
      description: "Service role for CodeBuild GitHub Actions runner project",
      assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com"),
      managedPolicies: [
        // Allows CodeBuild to write logs and manage build artifacts
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSCodeBuildDeveloperAccess"
        ),
      ],
      inlinePolicies: {
        AssumeDeployRole: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: "AllowAssumeDeployRole",
              effect: iam.Effect.ALLOW,
              actions: ["sts:AssumeRole"],
              resources: [deployRole.roleArn],
            }),
          ],
        }),
      },
    });

    return role;
  }

  /**
   * Create the CodeBuild project configured as a GitHub Actions self-hosted runner.
   *
   * The runner label format used in workflow YAML must be:
   *   codebuild-<projectName>-${{ github.run_id }}-${{ github.run_attempt }}
   * (BR-PIPE-08)
   */
  private _createCodeBuildProject(
    serviceRole: iam.Role,
    githubRepo: string
  ): codebuild.Project {
    const [owner, repo] = githubRepo.split("/");

    const project = new codebuild.Project(this, "CodeBuildRunnerProject", {
      projectName: "flask-lambda-api-runner",
      description: `GitHub Actions self-hosted runner for ${githubRepo}`,
      role: serviceRole,
      // Amazon Linux 2023 standard image with Node 18, Python 3.11
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_5,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          // Variables available to all builds
          REPO_OWNER: { value: owner },
          REPO_NAME: { value: repo },
        },
      },
      // GitHub source — connects to the repo
      source: codebuild.Source.gitHub({
        owner,
        repo,
        // Webhook triggers are managed by GitHub Actions — not needed here
        webhook: false,
      }),
      // Minimal buildspec — actual steps come from GitHub Actions workflow YAML
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          build: {
            commands: [
              // This buildspec is only used for manual CodeBuild runs.
              // When triggered by GitHub Actions, the runner ignores this buildspec
              // and executes the workflow YAML steps instead.
              "echo 'CodeBuild runner ready'",
            ],
          },
        },
      }),
    });

    return project;
  }

  /**
   * Emit outputs needed to configure GitHub Actions.
   */
  private _createOutputs(
    deployRole: iam.Role,
    project: codebuild.Project
  ): void {
    new cdk.CfnOutput(this, "DeployRoleArn", {
      value: deployRole.roleArn,
      description:
        "Set as GitHub Actions variable AWS_ROLE_ARN. Used by configure-aws-credentials action.",
    });

    new cdk.CfnOutput(this, "CodeBuildProjectName", {
      value: project.projectName,
      description:
        "Used to build the runs-on label: codebuild-<this-value>-${{ github.run_id }}-${{ github.run_attempt }}",
    });
  }
}
