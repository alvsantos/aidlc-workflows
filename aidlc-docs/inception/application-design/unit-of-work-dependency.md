# Unit of Work Dependencies

## Dependency Matrix

| Unit | Depends On | Dependency Type | When |
|---|---|---|---|
| `app` | — | No dependencies | Development can start immediately |
| `infra` | `app` | Build-time asset bundling | CDK bundles `app/` as Lambda zip at `cdk synth` |
| `pipeline` | `infra` | Deploy-time (CDK target) | Pipeline runs `cdk deploy` on stacks defined in `infra` |
| `pipeline` | GitHub repo | Runtime (GitHub Actions) | Workflows must be pushed to the repo to activate |

## Dependency Diagram

```
+----------+
|   app    |  (no dependencies — start here)
+----------+
     |
     | build-time: app/ bundled as Lambda zip asset
     v
+----------+
|  infra   |  depends on app artifact
+----------+
     |
     | deploy-time: pipeline deploys CDK stacks from infra
     v
+----------+
| pipeline |  depends on infra stacks + GitHub repo
+----------+
```

## Interface Contracts

### app → infra
- **Contract**: `app/` directory must contain a valid Python Lambda handler at `app/main.py` with a `handler(event, context)` function
- **Contract**: `app/requirements.txt` must list all runtime dependencies (pinned versions)
- **Breaking change**: Renaming `handler` function or moving `main.py` requires updating `LambdaFunction` asset handler path in `AppStack`

### infra → pipeline
- **Contract**: Stack names are `AppStack-dev` and `AppStack-prod` — pipeline workflows reference these by name
- **Contract**: CDK app entry point is `infra/app.ts` — `cdk deploy` is run from `infra/` directory
- **Breaking change**: Renaming stacks requires updating pipeline workflow YAML files

### pipeline → GitHub repo
- **Contract**: Repo is hosted at `github.com/{owner}/{repo}` — OIDC trust policy and CodeBuild GitHub connection reference this
- **Contract**: Branches `dev` and `main` must exist
- **Breaking change**: Moving to a different repo requires updating PipelineStack OIDC trust policy and CodeBuild source config

## Circular Dependency Check

No circular dependencies. The dependency graph is a strict DAG:
```
app → infra → pipeline
```

## Parallel Development Opportunities

| Phase | Can be done in parallel |
|---|---|
| Write Python app code + unit tests | Yes — no AWS dependencies |
| Write CDK AppStack | Yes — can be written before app is complete (uses placeholder asset path) |
| Write PipelineStack | Yes — independent of app and AppStack content |
| Write GitHub Actions YAML | Yes — structure is known from design |
| Test app locally | Yes — `pytest` runs without AWS |
| `cdk synth` AppStack | Requires `app/` directory to exist (even empty) |
| `cdk deploy AppStack-dev` | Requires `app/requirements.txt` + `app/main.py` complete |
| `cdk deploy PipelineStack` | Independent — can be done any time after CDK bootstrap |
