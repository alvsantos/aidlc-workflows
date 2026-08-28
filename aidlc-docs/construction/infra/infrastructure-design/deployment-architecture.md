# Deployment Architecture — Unit: infra

## Stack Isolation Model

Two completely separate CloudFormation stacks share the same CDK code but have independent lifecycles:

```
AppStack-dev                    AppStack-prod
├── Lambda: flask-lambda-api-dev    ├── Lambda: flask-lambda-api-prod
├── API GW: dev stage               ├── API GW: prod stage
├── Log groups (7d retention)       ├── Log groups (30d retention)
└── IAM role (dev)                  └── IAM role (prod)

  Removal policy: DESTROY             Removal policy: RETAIN (log groups)
```

No resource is shared between stacks — full isolation. A `cdk destroy AppStack-dev` has zero impact on prod.

## CDK Bootstrap Requirements

Before the first `cdk deploy`, CDK bootstrap must be run once per account/region:

```bash
npx cdk bootstrap aws://ACCOUNT_ID/us-east-1
```

Bootstrap creates:
- S3 bucket for CDK assets (Lambda zip, templates)
- ECR repository for Docker image assets (not needed for zip Lambda)
- IAM roles: `cdk-cfn-exec-role`, `cdk-deploy-role`, `cdk-lookup-role`, `cdk-asset-publishing-role`

These bootstrap roles are what `GitHubActionsDeployRole` (unit: pipeline) will `sts:AssumeRole` into.

## Asset Publishing Flow

```
cdk deploy
    |
    ├── Synthesise TypeScript → CloudFormation template
    ├── Bundle app/ → Lambda zip (Docker pip install)
    ├── Upload zip to CDK asset S3 bucket
    └── Deploy CloudFormation changeset
              └── Lambda updated with new zip S3 location
```

## Rollback Behaviour

CloudFormation handles rollback automatically:
- If a stack update fails mid-deploy, CloudFormation rolls back to the previous state
- Lambda rollback: previous function code version remains active until new deployment succeeds
- No manual rollback procedure needed — run `cdk deploy` again after fixing the issue
