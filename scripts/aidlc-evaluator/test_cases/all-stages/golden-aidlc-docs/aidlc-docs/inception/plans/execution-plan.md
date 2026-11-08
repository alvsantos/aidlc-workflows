# Execution Plan

## Detailed Analysis Summary

### Change Impact Assessment
- **User-facing changes**: Yes — all 27 API endpoints serve three user roles
- **Structural changes**: Yes — two independent microservices with inter-service communication
- **Data model changes**: Yes — new data models for books, members, checkouts, holds, fees
- **API changes**: Yes — complete REST API design for both services
- **NFR impact**: Yes — performance targets, security (RBAC, JWT), scalability requirements

### Risk Assessment
- **Risk Level**: Medium — complex business rules but well-defined requirements
- **Rollback Complexity**: Easy (greenfield, no existing system to break)
- **Testing Complexity**: Complex — two services, RBAC boundaries, lending policy edge cases

## Workflow Visualization

```
Phase 1: INCEPTION
  - Stage 1: Workspace Detection (COMPLETED)
  - Stage 2: Reverse Engineering (SKIPPED - greenfield)
  - Stage 3: Requirements Analysis (COMPLETED - includes user stories & personas)
  - Stage 4: UI Mockups (SKIPPED - no user-facing UI)
  - Stage 5: Workflow Planning (IN PROGRESS)
  - Stage 6: Application Design (EXECUTE)
  - Stage 7: Units Generation (EXECUTE)

Phase 2: CONSTRUCTION
  - Stage 8: NFR (EXECUTE - system-wide, once before per-unit loop)
  Per-unit loop:
  - Stage 9: Infrastructure Design (SKIP)
  - Stage 10: Code Generation (EXECUTE - includes detailed business-logic design)
  - Stage 11: Build and Test (EXECUTE)

Phase 3: OPERATIONS
  - Operations (PLACEHOLDER)
```

## Phases to Execute

### INCEPTION PHASE
- [x] Workspace Detection (COMPLETED)
- [x] Reverse Engineering (SKIPPED — greenfield project)
- [x] Requirements Analysis (COMPLETED — includes user stories and personas)
- [x] Workflow Planning (IN PROGRESS)
- [ ] UI Mockups — SKIP
  - **Rationale**: Both services are headless REST APIs with no user-facing UI. No mockups needed.
- [ ] Application Design — EXECUTE
  - **Rationale**: Two services need component identification, service boundaries, and dependency mapping. Critical for defining how Catalog and Lending services interact.
- [ ] Units Generation — EXECUTE (ALWAYS)
  - **Rationale**: System decomposes into two services (Catalog + Lending). Units define the build order and dependency sequence.

### CONSTRUCTION PHASE
- [ ] NFR — EXECUTE (system-wide, once before the per-unit loop)
  - **Rationale**: Database choice (DynamoDB vs PostgreSQL), authentication approach (PyJWT + bcrypt), performance patterns, and NFR design patterns need to be decided once across both services. Produces `construction/nfr/`.
- [ ] Infrastructure Design — SKIP (per-unit)
  - **Rationale**: CDK infrastructure deferred per stakeholder decision. Application code focuses on in-memory/SQLite for local dev with database abstraction layer. No cloud infrastructure to design.
- [ ] Code Generation — EXECUTE (ALWAYS, per-unit)
  - **Rationale**: Generate complete application code for both services. Detailed business-logic design (domain entities, business rules) is captured during this stage.
- [ ] Build and Test — EXECUTE (ALWAYS)
  - **Rationale**: Install dependencies, run tests, verify coverage.

### OPERATIONS PHASE
- [ ] Operations — PLACEHOLDER

## Success Criteria
- **Primary Goal**: Two independently runnable FastAPI services (Catalog + Lending) with complete business logic
- **Key Deliverables**:
  - Catalog Service with book CRUD, search, availability tracking
  - Lending Service with auth, checkouts, returns, renewals, holds, fees, reports
  - Unit and integration tests with >= 90% coverage
  - OpenAPI-compatible endpoint documentation
- **Quality Gates**:
  - All tests pass
  - >= 90% line coverage
  - RBAC enforced on all endpoints
  - Business rules verified (checkout limits, hold queues, fees, renewals)
  - Security extensions (SECURITY-01 through SECURITY-15) compliance verified
