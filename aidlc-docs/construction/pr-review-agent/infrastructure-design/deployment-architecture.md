# Deployment Architecture — Unit: pr-test-quality-gate

## Runtime topology (text)

```
Developer opens PR -> dev
        |
        v
GitHub Actions: ci.yml (existing test job + NEW quality-gate job)
        | runs-on: codebuild-flask-lambda-api-runner-<run_id>-<attempt>
        v
CodeBuild runner (existing)
        |
        |== STAGE 1 (deterministic, no AWS creds) =====================
        |   app:   pytest --cov  -> coverage %  (>= APP_COVERAGE_MIN)
        |   infra: npm test --coverage -> coverage % (>= INFRA_COVERAGE_MIN)
        |   all pass? --no--> set status FAIL_STAGE1 (block), stop
        |     |
        |    yes
        |== STAGE 2 (only on Stage 1 pass) ============================
        |   configure-aws-credentials (OIDC JWT -> sts:AssumeRoleWithWebIdentity)
        |     -> GitHubActionsDeployRole (existing; +GetSecretValue)
        |   aws secretsmanager get-secret-value (KIRO_SECRET_ARN) -> KIRO_API_KEY (masked)
        |   kiro-cli chat --no-interactive  (pinned; constrained tools; timeout)
        |     -> {verdict, rationale}
        |     -> parse -> compute gate verdict
        v
GitHub: upsert PR comment (idempotent) + set required status check
        |
        v
Branch protection on `dev` requires the status check -> merge gated
```

## Bootstrap / one-time setup (documented, not code where noted)
```
1. Create the Kiro key secret:
     aws secretsmanager create-secret --name pr-gate/kiro-api-key --secret-string "<KIRO_API_KEY>"
2. Update PipelineStack (CDK) to add the scoped GetSecretValue statement to GitHubActionsDeployRole:
     npx cdk deploy PipelineStack --context envName=pipeline --context githubRepo=owner/repo
3. Set GitHub repo variables: KIRO_SECRET_ARN, KIRO_CLI_VERSION, APP_COVERAGE_MIN, INFRA_COVERAGE_MIN
     (AWS_ROLE_ARN, AWS_REGION already set from Iteration 1)
4. Add branch protection on `dev`: require the "pr-test-quality-gate" status check
5. Open a PR to dev -> gate runs
```

## Rollback
- Remove the `quality-gate` job from `ci.yml` and delete `.github/scripts/pr-gate/`.
- Remove the `GetSecretValue` statement from `PipelineStack` and redeploy.
- Optionally delete the Secrets Manager secret.
All reversible; no impact on `AppStack` or deploy workflows.

## Files touched
```
infra/stacks/pipeline-stack.ts     # add scoped GetSecretValue statement to GitHubActionsDeployRole
.github/workflows/ci.yml           # add quality-gate job (Stage 1 + Stage 2)
.github/scripts/pr-gate/*          # new bash + jq scripts
infra/ (test/coverage config)      # add coverage-capable npm test (Q4=A)
```
