# NFR (Requirements & Design)

Single, combined non-functional stage covering both **what** the NFRs are (requirements + tech stack) and **how** they are addressed (patterns + logical components).

**Runs once at the START of the CONSTRUCTION phase, before the per-unit loop** — it is system-wide, not per-unit. The resulting NFR decisions apply across all units; per-unit Infrastructure Design and Code Generation consume them.

## Prerequisites
- Units Generation must be complete (unit definitions available)
- Requirements, user stories, and Application Design artifacts must be available
- Execution plan must indicate the NFR stage should execute

## Overview
Determine the system's non-functional requirements and tech stack, then design the patterns and logical components that satisfy them — in one stage with a single approval gate.

## Steps to Execute

### Step 1: Analyze Context
- Read the requirements, user stories, Application Design (component methods/interfaces), and the unit definitions
- Understand overall complexity, load, and quality expectations across the system

### Step 2: Create NFR Plan
- Generate a plan with checkboxes [] covering BOTH the requirements/tech-stack assessment AND the design (patterns + logical components)
- Each step should have a checkbox []

### Step 3: Generate Context-Appropriate Questions (SINGLE SET)
**DIRECTIVE**: Thoroughly analyze the context to identify ALL areas where NFR clarification would improve system quality and architecture decisions. Ask requirements-level and design-level questions together in **one optimized, non-duplicated set** — do not ask the same concept twice at different phases.

**CRITICAL**: Default to asking questions when there is ANY ambiguity or missing detail that could affect system quality. It's better to ask too many questions than to make incorrect NFR assumptions.

- EMBED questions using [Answer]: tag format
- **When in doubt, ask the question** - overconfidence leads to poor system quality

**Requirements-level categories** (consider ALL):
- **Scalability Requirements** - expected load, growth patterns, scaling triggers, capacity planning
- **Performance Requirements** - response times, throughput, latency, benchmarks
- **Availability Requirements** - uptime expectations, disaster recovery, failover, business continuity
- **Security Requirements** - data protection, compliance, authentication, authorization, threat models
- **Tech Stack Selection** - technology preferences, constraints, existing systems, integration requirements
- **Reliability Requirements** - error handling, fault tolerance, monitoring, alerting
- **Maintainability Requirements** - code quality, documentation, testing, operational needs
- **Usability Requirements** - user experience, accessibility, interface requirements

**Design-level categories** (consider ALL):
- **Resilience Patterns** - fault tolerance approach, retry strategies, failure recovery
- **Scalability Patterns** - scaling mechanisms, load boundaries, growth projections
- **Performance Patterns** - optimization strategy, latency targets, throughput requirements
- **Security Patterns** - security implementation approach, threat model, compliance constraints
- **Logical Components** - infrastructure components (queues, caches, circuit breakers, etc.) and their integration patterns

### Step 4: Store Plan
- Save as `aidlc-docs/construction/plans/nfr-plan.md`
- Include all [Answer]: tags for user input

### Step 5: Collect and Analyze Answers
- Wait for user to complete all [Answer]: tags
- **MANDATORY**: Carefully review ALL responses for vague or ambiguous answers
- **CRITICAL**: Add follow-up questions for ANY unclear responses - do not proceed with ambiguity
- Look for responses like "depends", "maybe", "not sure", "mix of", "somewhere between", "standard", "typical"
- **Do not proceed until ALL ambiguities are resolved**

### Step 6: Generate NFR Artifacts
- Create `aidlc-docs/construction/nfr/nfr-requirements.md`
- Create `aidlc-docs/construction/nfr/tech-stack-decisions.md`
- Create `aidlc-docs/construction/nfr/nfr-design-patterns.md`
- Create `aidlc-docs/construction/nfr/logical-components.md`

### Step 7: Present Completion Message
- Present completion message in this structure:
     1. **Completion Announcement** (mandatory): Always start with this:

```markdown
# 📊 NFR Complete
```

     2. **AI Summary** (optional): Provide structured bullet-point summary
        - List key scalability, performance, availability, and security requirements
        - List tech stack decisions and rationale
        - List key design patterns and logical components applied
        - DO NOT include workflow instructions ("please review", "let me know", "proceed to next phase", "before we proceed")
        - Keep factual and content-focused
     3. **Formatted Workflow Message** (mandatory): Always end with this exact format:

```markdown
> **📋 <u>**REVIEW REQUIRED:**</u>**  
> Please examine the NFR artifacts at: `aidlc-docs/construction/nfr/`



> **🚀 <u>**WHAT'S NEXT?**</u>**
>
> **You may:**
>
> 🔧 **Request Changes** - Ask for modifications to the NFRs or NFR design based on your review  
> ✅ **Continue to Next Stage** - Approve NFRs and proceed to **[next-stage-name]**

---
```

### Step 8: Wait for Explicit Approval
- Do not proceed until the user explicitly approves the NFRs and NFR design
- If user requests changes, update the artifacts and repeat the approval process

### Step 9: Record Approval and Update Progress
- Log approval in audit.md with timestamp
- Record the user's approval response with timestamp
- Mark NFR stage complete in aidlc-state.md

## Critical Rules
- **ONE STAGE, ONE GATE**: Requirements and design for NFRs are produced together and approved in a single gate. Do not split into separate requirements and design approvals.
- **SYSTEM-WIDE, NOT PER-UNIT**: Runs once before the per-unit loop; decisions apply across all units.
