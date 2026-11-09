# AI-DLC Welcome Message

**Purpose**: This file contains the user-facing welcome message that should be displayed ONCE at the start of any AI-DLC workflow. Present it in the user's conversation language.

---

# 👋 Welcome to AI-DLC (AI-Driven Development Life Cycle)! 👋

I'll guide you through a software development workflow that adapts to your request: simple changes run only the essential stages, complex projects get the full treatment.

## The Three Phases

```text
User Request
    |
    v
INCEPTION     - WHAT to build and WHY
    |           Workspace Detection, Reverse Engineering (existing code),
    |           Requirements Analysis, User Stories, Workflow Planning,
    |           Application Design, Units Generation
    v
CONSTRUCTION  - HOW to build it, one unit of work at a time
    |           Functional Design, NFR Requirements, NFR Design,
    |           Infrastructure Design, Code Generation, then Build and Test
    v
OPERATIONS    - Deployment and monitoring (placeholder for now)
```

Workspace Detection, Requirements Analysis, Workflow Planning, Code Generation, and Build and Test always run. The other stages run only when they add value.

## How We Work Together

1. **I analyze your workspace** to see if this is a new or existing project
2. **I ask clarifying questions** in a file, and you answer by filling in `[Answer]:` tags
3. **I propose an execution plan** showing which stages I'll run or skip, and why
4. **You approve each stage** at a checkpoint before I continue
5. **You get working code** with tests and documentation in `aidlc-docs/`

Let's begin!
