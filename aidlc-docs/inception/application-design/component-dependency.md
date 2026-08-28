# Component Dependencies

## Dependency Matrix

| Component | Depends On | Dependency Type | Reason |
|---|---|---|---|
| `ApiHandler` | `PowertoolsConfig` | Compile-time import | Needs shared `app` resolver and `logger` |
| `ApiHandler` | `HealthController` | Compile-time import | Registers `/health` route |
| `ApiHandler` | `HelloController` | Compile-time import | Registers `/hello/{name}` route |
| `ApiHandler` | `VersionController` | Compile-time import | Registers `/version` route |
| `HealthController` | `PowertoolsConfig` | Compile-time import | Uses shared `app` resolver for route registration |
| `HelloController` | `PowertoolsConfig` | Compile-time import | Uses shared `app` resolver for route registration |
| `VersionController` | `PowertoolsConfig` | Compile-time import | Uses shared `app` resolver for route registration |
| `AppStack` | `app/` (zip asset) | Build-time asset | Lambda function code asset bundled from app directory |
| `PipelineStack` | `AppStack` | Deployment-time | CodeBuild runner deploys AppStack; needs stack names as config |
| `CiWorkflow` | `ReusableDeployWorkflow` | Workflow call | Delegates deploy step to reusable workflow |
| `CdWorkflow` | `ReusableDeployWorkflow` | Workflow call | Delegates deploy step to reusable workflow |
| `ReusableDeployWorkflow` | `GitHubActionsDeployRole` | Runtime (OIDC) | Assumes IAM role via OIDC to get AWS credentials |
| `ReusableDeployWorkflow` | `AppStack` | Runtime (CDK deploy) | Runs `cdk deploy` which targets AppStack |
| `CodeBuildRunnerProject` | `GitHubActionsDeployRole` | Runtime (IAM) | CodeBuild service role needs CDK deploy permissions |

---

## Cross-Unit Dependencies

```
+------------------+         +------------------+         +------------------+
|   Unit: app      |         |   Unit: infra    |         |  Unit: pipeline  |
|                  |         |                  |         |                  |
| ApiHandler       |         | AppStack         |         | PipelineStack    |
| HealthController | <──────  | LambdaFunction   | <──────  | CiWorkflow       |
| HelloController  | (asset) | ApiGatewayHttpApi| (deploy) | CdWorkflow       |
| VersionController|         | LambdaExecRole   |         | DeployWorkflow   |
| PowertoolsConfig |         |                  |         | CodeBuildRunner  |
+------------------+         +------------------+         | OidcProvider     |
                                                          | DeployRole       |
                                                          +------------------+
```

**Legend**:
- `app → infra`: `AppStack` bundles the `app/` directory as a Lambda zip asset at synth time
- `infra → pipeline`: `CiWorkflow`/`CdWorkflow` run `cdk deploy AppStack-{env}` using the IAM role from `PipelineStack`
- `pipeline` depends on `infra` outputs (stack names) but **not** on `app` directly — the app is included via the infra CDK asset bundling

---

## Communication Patterns

### app → API Gateway → Lambda (runtime)
```
Internet
  └── API Gateway HTTP API (HTTPS)
        └── Lambda Proxy Integration
              └── ApiHandler.handler(event, context)
                    └── Powertools ApiGatewayResolver
                          └── HealthController | HelloController | VersionController
```

### GitHub Actions → CodeBuild → AWS (pipeline runtime)
```
GitHub (PR/push event)
  └── GitHub Actions runner selection: CodeBuild project
        └── CodeBuild job starts
              └── OIDC token request → GitHub OIDC IdP
                    └── sts:AssumeRoleWithWebIdentity → GitHubActionsDeployRole
                          └── cdk deploy AppStack-{env}
                                └── CloudFormation changeset
                                      └── Lambda + API GW updated
```

---

## Deployment Order

```
1. cdk deploy PipelineStack        (once, bootstrap)
       ↓
2. Configure GitHub Actions vars   (AWS_ROLE_ARN, AWS_REGION, CODEBUILD_PROJECT)
       ↓
3. cdk bootstrap (target account)  (once per account/region)
       ↓
4. PR to dev branch
       ↓ triggers CiWorkflow
5. cdk deploy AppStack-dev         (automated, on every PR)
       ↓
6. Merge dev → main
       ↓ triggers CdWorkflow
7. cdk deploy AppStack-prod        (automated, on merge)
```
