# NFR Design Plan — Unit: pr-review-agent

> **⚠️ SUPERSEDED (2026-09-17)**: Reflects the earlier Kiro-CLI + Secrets-Manager design. The feature was reframed to a **two-stage test-quality gate** (deterministic coverage + Bedrock-via-OIDC adequacy). See the current `nfr-design/` artifacts. Kept for history only.

## Open Questions
All NFR design decisions are determined by prior stages (engine, auth via Secrets-Manager-over-OIDC, gh CLI with built-in token, fail-closed, timeout, size cap, constrained CLI tool posture, pinned deps). **No open questions** — proceeding directly to design artifacts.

If the reviewer disagrees with any pattern below, they can Request Changes.

## Plan Checklist
- [x] Design security patterns (OIDC → Secrets Manager retrieval + masking; least-privilege GetSecretValue; scoped GITHUB_TOKEN; prompt-injection + constrained tools)
- [x] Design resilience/fail-safe patterns (timeout, exit-code checks, fail-closed verdict, idempotent upsert)
- [x] Design performance patterns (size guard, single CLI invocation)
- [x] Define logical components (module decomposition, pure vs I/O boundary)
- [x] Generate nfr-design-patterns.md and logical-components.md
