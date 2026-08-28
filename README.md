# IaC + CI/CD Pipeline Project

A Python REST API deployed to AWS Lambda, provisioned with **AWS Blocks** (CDK), and delivered through a **GitHub Actions + AWS CodeBuild** CI/CD pipeline across dev and prod environments.

---

## What This Project Builds

| Component | Technology |
|---|---|
| Infrastructure as Code | AWS Blocks (built on AWS CDK) |
| Application | Python Flask/FastAPI REST API |
| Compute | AWS Lambda |
| API Exposure | Amazon API Gateway (HTTP API) |
| CI/CD Orchestration | GitHub Actions |
| CI/CD Runner | AWS CodeBuild (hosted runner for GitHub Actions) |
| Environments | `dev` (PR to `dev` branch) → `prod` (merge to `main`) |
| AWS Auth in pipeline | OIDC federation (no long-lived IAM keys) |
| IaC Comparison | AWS Blocks vs Terraform (documented in this README) |

---

## How This Project Was Built — Using AI-DLC

This project was developed using **AI-DLC (AI-Driven Development Life Cycle)**, an adaptive AI-assisted workflow that guides structured software development through three phases: **Inception → Construction → Operations**.

AI-DLC was run inside [Kiro IDE](https://kiro.dev) using the [`aidlc-amit-verma` power](https://github.com/aws-samples/sample-ai-dlc-kiro-power).

### What AI-DLC Did

Rather than jumping straight to code, AI-DLC ensured every technical decision was **evaluated, documented, and approved** before implementation:

1. **Workspace Detection** — Detected a greenfield project, initialized state tracking and audit log
2. **Requirements Analysis** — Asked 13 structured questions about IaC tools, pipeline design, deployment targets, environments, and documentation depth. Resolved ambiguities before writing any requirements.
3. **Workflow Planning** — Determined which stages to execute (Application Design, Units Generation, per-unit design, Code Generation)
4. **Application Design** — Designed components, services, and their dependencies
5. **Units Generation** — Decomposed the system into units of work for parallel development
6. **Construction Phase** — Per-unit functional design, NFR requirements, infrastructure design, and code generation — each with explicit approval gates
7. **Build and Test** — Generated build, unit test, and integration test instructions

All artifacts (requirements, designs, decisions, audit log) are tracked in [`aidlc-docs/`](./aidlc-docs/).

### AI-DLC Artifact Trail

```
aidlc-docs/
├── inception/
│   ├── requirements/
│   │   ├── requirement-verification-questions.md  ← 13 answered questions
│   │   ├── requirement-clarification-questions.md ← ambiguity resolution
│   │   └── requirements.md                        ← full requirements doc
│   ├── plans/
│   │   └── execution-plan.md                      ← which stages run and why
│   ├── user-stories/                               ← (if generated)
│   └── application-design/                        ← components + services
├── construction/
│   ├── plans/                                      ← per-unit code gen plans
│   └── {unit-name}/
│       ├── functional-design/
│       ├── nfr-requirements/
│       ├── infrastructure-design/
│       └── code/
├── aidlc-state.md                                  ← live workflow state
└── audit.md                                        ← full interaction log
```

### Why AI-DLC

Traditional AI coding tools jump straight to implementation. AI-DLC enforces a structured process:

- **Every decision is questioned** — ambiguous choices surface as clarification questions before code is written
- **Nothing is assumed** — the user approves requirements, design, and code plans at each stage
- **Everything is documented** — the full decision trail lives in `aidlc-docs/` and can be committed alongside code
- **Security is built in** — the Security Baseline extension enforced OWASP-aligned rules (OIDC over IAM keys, least-privilege IAM, no hardcoded secrets) as blocking constraints throughout the workflow

---

## Architecture

```
Developer
    |
    | git push feature/xyz
    v
GitHub Repository
    |
    +-- PR to `dev` ──────────────────────────────────────────────────+
    |       |                                                          |
    |       v                                                          |
    |   GitHub Actions (CI Workflow)                                   |
    |       |                                                          |
    |       v                                                          |
    |   AWS CodeBuild (hosted runner)                                  |
    |       |── lint + unit tests                                      |
    |       |── cdk synth (validate IaC)                               |
    |       └── cdk deploy AppStack-dev ──► Lambda (dev) + APIGW (dev)|
    |                                                                  |
    +-- Merge to `main` ───────────────────────────────────────────────+
            |
            v
        GitHub Actions (CD Workflow)
            |
            v
        AWS CodeBuild (hosted runner)
            └── cdk deploy AppStack-prod ──► Lambda (prod) + APIGW (prod)
```

**Auth flow**: GitHub Actions uses OIDC to assume an IAM role in AWS — no stored access keys.

---

## IaC Comparison: AWS Blocks vs Terraform

| Dimension | AWS Blocks | Terraform |
|---|---|---|
| **Abstraction level** | Very high — opinionated, minimal boilerplate | Medium — explicit resource definitions |
| **Language** | TypeScript (CDK under the hood) | HCL (HashiCorp Configuration Language) |
| **AWS-native** | Yes — built by AWS, first-class CDK/CloudFormation integration | No — cloud-agnostic via providers |
| **State management** | No state file — CloudFormation manages state | Local or remote `.tfstate` file required |
| **Learning curve** | Low for CDK users; new concept for others | Moderate — HCL is straightforward but state management adds complexity |
| **Ecosystem** | AWS CDK construct library + AWS Blocks constructs | Terraform Registry — thousands of providers and modules |
| **Multi-cloud** | AWS only | Yes — supports AWS, GCP, Azure, and more |
| **Drift detection** | Via CloudFormation drift detection | `terraform plan` compares state to real infra |
| **Best for** | AWS-only projects, teams already in CDK/TypeScript ecosystem, rapid AWS scaffolding | Multi-cloud, existing Terraform teams, organizations with strict state management requirements |

**Decision for this project**: AWS Blocks was chosen because the goal was to explore a newer, higher-level CDK abstraction and understand how it compares to the lower-level CDK and to Terraform. AWS Blocks reduces boilerplate significantly while still producing CDK/CloudFormation artifacts that are fully inspectable.

---

## Pipeline Configuration

### Trigger Rules

| Event | Branch | Workflow | Effect |
|---|---|---|---|
| Pull Request opened/updated | `dev` | CI | Lint, unit tests, cdk synth, deploy to dev |
| Push (merge) | `main` | CD | Deploy to prod |

### Stages

**CI Workflow (`.github/workflows/ci.yml`)**
1. Checkout code
2. Set up Python + Node.js (for CDK CLI)
3. Install dependencies (`pip install`, `npm install`)
4. Run linting (`flake8` or `ruff`)
5. Run unit tests (`pytest`)
6. Run `cdk synth` (validate IaC compiles without errors)
7. Assume AWS role via OIDC
8. Run `cdk deploy AppStack-dev --require-approval never`

**CD Workflow (`.github/workflows/cd.yml`)**
1. Checkout code
2. Set up Python + Node.js
3. Install dependencies
4. Assume AWS role via OIDC
5. Run `cdk deploy AppStack-prod --require-approval never`

### CodeBuild as GitHub Actions Runner

AWS CodeBuild is configured as a self-hosted runner for GitHub Actions. This means:
- GitHub Actions orchestrates the workflow definition (triggers, steps, environment)
- CodeBuild provides the compute environment (build machine, IAM role, VPC if needed)
- No GitHub-hosted runner minutes are consumed
- The CodeBuild project has an IAM role that grants it permission to deploy CDK stacks

---

## Project Structure

```
.
├── app/                        # Python REST API (Flask/FastAPI)
│   ├── main.py                 # Lambda handler + API routes
│   ├── requirements.txt        # Python dependencies (pinned versions)
│   └── tests/
│       └── test_main.py        # Unit tests (pytest)
├── infra/                      # AWS Blocks IaC
│   ├── app.ts                  # CDK app entry point
│   ├── stacks/
│   │   └── app-stack.ts        # AppStack (Lambda + API Gateway + IAM)
│   ├── package.json            # CDK + AWS Blocks dependencies
│   └── cdk.json                # CDK context configuration
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI: PR to dev
│       └── cd.yml              # CD: merge to main
├── aidlc-docs/                 # AI-DLC workflow artifacts
├── README.md                   # This file
└── .gitignore
```

---

## Setup & Deployment

### Prerequisites
- AWS CLI configured with credentials
- Node.js 18+ and npm
- Python 3.11+
- CDK CLI: `npm install -g aws-cdk`
- AWS Blocks: installed via `npm install` in `infra/`

### Local Development

```bash
# Install Python dependencies
cd app
pip install -r requirements.txt

# Run tests locally
pytest tests/

# Install IaC dependencies
cd ../infra
npm install

# Synthesize CloudFormation template (validate IaC)
cdk synth

# Deploy to dev
cdk deploy AppStack-dev --require-approval never
```

### First-Time AWS Setup

1. Bootstrap CDK in your AWS account:
   ```bash
   cdk bootstrap aws://ACCOUNT_ID/REGION
   ```
2. Create the OIDC provider in IAM for GitHub Actions (see `infra/stacks/oidc-stack.ts`)
3. Create a CodeBuild project configured as a GitHub Actions runner
4. Set the IAM Role ARN as a GitHub Actions variable (`AWS_ROLE_ARN`)

---

## Key Architecture Decisions

| Decision | Chosen | Rationale |
|---|---|---|
| IaC Tool | AWS Blocks | Higher abstraction on CDK — less boilerplate, still inspectable as CloudFormation |
| CI/CD | GitHub Actions + CodeBuild | GitHub Actions for workflow familiarity; CodeBuild for AWS-native execution and IAM integration |
| Compute | AWS Lambda | Serverless, no infra to manage, generous free tier, ideal for API workloads |
| API Layer | Amazon API Gateway HTTP API | Lower cost and latency than REST API; sufficient for this use case |
| AWS Auth in pipeline | OIDC | Eliminates long-lived IAM credentials as GitHub secrets — security best practice |
| Branching strategy | Feature → `dev` → `main` | Simple two-environment promotion; clear separation of integration and production |
| Python packaging | Zip artifact | Simplest Lambda deployment model; container image not needed at this scale |

---

## Learnings

> _This section is populated as the project is built and deployed._

- [ ] AWS Blocks vs raw CDK: what boilerplate it actually eliminates
- [ ] CodeBuild as GitHub Actions runner: setup friction and IAM configuration
- [ ] OIDC setup for GitHub Actions: one-time complexity worth the long-term security benefit
- [ ] CDK environment separation (dev vs prod): context variables vs environment configs
- [ ] Lambda cold start behaviour with Flask vs FastAPI

### 🔍 Finding: Granularity of Steps — aidlc-workflows vs APEX/Delivery Agent

**Context**: Observed during active use of both frameworks on comparable projects.

**Observation**: `aidlc-workflows` follows a fine-grained, stage-by-stage execution model where each stage produces a small, focused artifact and immediately asks for approval before moving on. APEX/Delivery Agent tends to batch more work into larger validation steps, completing more before surfacing results to the user.

**Comparison**:

| Dimension | `aidlc-workflows` | APEX / Delivery Agent |
|---|---|---|
| **Step granularity** | Fine — one artifact per stage (e.g., business-rules.md, nfr-requirements.md, tech-stack-decisions.md) | Coarse — multiple artifacts produced in a single large step before surfacing for review |
| **Approval gates** | Frequent — after every stage, user reviews and approves a small, focused output | Less frequent — approval happens after a larger block of work is complete |
| **Rework cost** | Low — if a design decision is wrong, only one small artifact needs to change | Higher — a wrong decision in a large step may cascade across multiple artifacts generated together |
| **Feedback loop** | Tight — user catches issues early, before downstream stages are generated | Looser — issues may only surface after significant work has been done |
| **Cognitive load per review** | Low — one focused document to review at a time | Higher — multiple documents to review simultaneously |
| **Total time to first working code** | Potentially slower per stage, but less rework overall | Faster to a first draft, but more rework if direction changes |
| **Best for** | Projects where requirements are still being discovered or may evolve during design | Projects with well-defined, stable requirements where large steps can be taken confidently |

**Example from this project**: The `app` unit went through 4 separate approval gates — Functional Design → NFR Requirements → NFR Design → Code Generation (Part 1 Plan). Each gate produced 2–3 focused documents. If the NFR requirements needed to change (e.g., swapping Powertools for Mangum), only `nfr-requirements.md` and `tech-stack-decisions.md` needed updating — the functional design artifacts remained untouched. In APEX, these concerns are typically bundled, so a tech stack change would require revisiting a larger combined artifact.

**Takeaway**: The step-by-step model of `aidlc-workflows` is a deliberate design choice that trades raw throughput for **lower rework cost and higher early-stage confidence**. It is particularly valuable when architectural decisions are being made for the first time (as in a learning project or a new domain), where the cost of catching a wrong decision late is higher than the cost of frequent approval gates.

---

### 🔍 Finding: AI-DLC Workflow Speed vs APEX (ProServe Framework)

**Context**: This project was built using the open-source [`aidlc-workflows`](https://github.com/awslabs/aidlc-workflows) ruleset running inside Kiro IDE, via the `aidlc-amit-verma` Power. During development, a direct comparison was made against **APEX** — the AWS ProServe internal AI-DLC framework — which runs the same methodology but with a heavier MCP tooling layer.

**Observation**: The `aidlc-workflows` approach generated requirements, clarification questions, an execution plan, and initial application design artifacts noticeably faster than an equivalent APEX session on a comparable project.

**Hypothesis on the tradeoff**:

| Dimension | `aidlc-workflows` (open-source) | APEX (ProServe) |
|---|---|---|
| **Speed** | Fast — steering files injected as context; minimal MCP round-trips | Slower — orchestrates more MCP tool calls per stage |
| **MCP tool usage** | Minimal — file reads/writes handled by the IDE agent directly | Heavy — dedicated MCP servers for artifact management, validation, tracing |
| **Rigor** | Rules enforced via steering file constraints; agent self-validates | Programmatic enforcement — MCP tools explicitly check compliance gates |
| **Audit trail** | Markdown files written by the agent (audit.md, state.md) | Structured data managed by MCP servers with richer metadata |
| **Portability** | High — runs in any IDE that supports steering files | Lower — tied to ProServe toolchain and MCP server infrastructure |
| **Best for** | Individual developers, open-source projects, learning AI-DLC | Enterprise engagements requiring auditable, traceable delivery artifacts |

**Takeaway**: The speed advantage of `aidlc-workflows` comes from reducing the orchestration overhead — each stage is a direct agent execution with context from steering files rather than a multi-hop MCP tool chain. The tradeoff is that compliance enforcement is softer (the agent self-polices via rules) vs APEX's harder programmatic gates. For a project like this one — a learning exercise with moderate complexity — `aidlc-workflows` hits the right balance of speed, structure, and documentation quality.

---

## References

- [AWS Blocks documentation](https://docs.aws.amazon.com/blocks/)
- [AWS CDK Developer Guide](https://docs.aws.amazon.com/cdk/v2/guide/)
- [GitHub Actions with CodeBuild](https://docs.aws.amazon.com/codebuild/latest/userguide/action-runner.html)
- [Configuring OIDC for GitHub Actions + AWS](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [AI-DLC methodology](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)
- [aidlc-amit-verma Kiro Power](https://github.com/aws-samples/sample-ai-dlc-kiro-power)
