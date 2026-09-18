# Infrastructure Design — Unit: pr-test-quality-gate

## Decisions (from infra plan answers)
- **Q1=A**: Reuse the existing `GitHubActionsDeployRole` (add a scoped statement) — no new role.
- **Q2=A**: Define the change in `PipelineStack` (CDK). **Update the existing role's inline policy if present, else add** — `GitHubActionsDeployRole` already has a `CdkDeployPolicy` inline policy (verified in `infra/stacks/pipeline-stack.ts` line ~105); we ADD a new statement rather than a new role.
- **Q3 → resolved via clarification**: Stage 2 engine = **Kiro CLI** (not Bedrock); therefore the IAM grant is **`secretsmanager:GetSecretValue`** (not `bedrock:InvokeModel`).
- **Q4=A**: Generate an `infra/` coverage-capable test command in Code Generation.

## AWS Resources (delta to existing PipelineStack)

| Resource | AWS Service | Change | Notes |
|---|---|---|---|
| `GitHubActionsDeployRole` | IAM Role (existing) | **Modify** | Add scoped `secretsmanager:GetSecretValue` statement to its inline policy |
| Kiro API key secret | AWS Secrets Manager | **New** (bootstrap) | Holds `KIRO_API_KEY`; encrypted at rest (KMS); read at runtime by the gate |
| OIDC provider / trust | IAM (existing) | Unchanged | Reused as-is; trust already scoped to the repo |
| CodeBuild runner | CodeBuild (existing) | Unchanged | Kiro CLI + jq installed as pinned versions in the workflow step |

### IAM statement to add (least-privilege, SECURITY-06)
```jsonc
{
  "Sid": "AllowReadKiroApiKey",
  "Effect": "Allow",
  "Action": "secretsmanager:GetSecretValue",
  "Resource": "arn:aws:secretsmanager:us-east-1:<acct>:secret:pr-gate/kiro-api-key-*"
}
```
Added to the existing `CdkDeployPolicy` inline policy on `GitHubActionsDeployRole` (or a new inline policy `PrGateSecretsPolicy` on the same role). No wildcards; scoped to the single secret.

## What is NOT changed
- No new IAM role (Q1=A).
- No `bedrock:*` permission (engine is Kiro CLI, not Bedrock).
- No `AppStack` changes.
- Existing OIDC trust and CodeBuild config untouched.

## Config surfaced to GitHub (repo variables, not secrets)
| Variable | Purpose |
|---|---|
| `AWS_ROLE_ARN` | existing — OIDC role (now also grants GetSecretValue) |
| `AWS_REGION` | `us-east-1` |
| `KIRO_SECRET_ARN` | ARN of the Kiro key secret |
| `KIRO_CLI_VERSION` | pinned Kiro CLI version |
| `APP_COVERAGE_MIN` / `INFRA_COVERAGE_MIN` | coverage thresholds (default 80) |

No `KIRO_API_KEY` in GitHub — fetched at runtime from Secrets Manager.

## Security Compliance (this stage)
- **SECURITY-06**: scoped `secretsmanager:GetSecretValue` on one secret ARN — compliant.
- **SECURITY-12**: no static AI key in GitHub; OIDC short-lived creds — compliant.
- **SECURITY-13/10**: IaC change is versioned in `PipelineStack`; pinned CLI/tools — compliant.
