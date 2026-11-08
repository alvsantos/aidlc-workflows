# NFR Design Patterns — System-Wide

System-wide design patterns applied across both the Catalog and Lending
services to satisfy the non-functional requirements. Decided once, before the
per-unit Construction loop.

## Authentication & Authorization

- **Pattern**: Stateless JWT bearer tokens validated per request via FastAPI
  dependency injection.
- **Password storage**: bcrypt hashing (direct `bcrypt` library).
- **RBAC**: Role claims (member, librarian, admin) embedded in the JWT and
  enforced by a shared `require_role` dependency on protected routes.

## Data Access

- **Pattern**: Repository abstraction (abstract base class) with an in-memory
  implementation for the MVP, swappable for DynamoDB/PostgreSQL later.
- **Rationale**: Isolates business logic from storage so the production backend
  can change without touching domain code.

## Error Handling

- **Pattern**: Centralized exception handlers mapping domain errors to HTTP
  status codes with a consistent JSON error envelope.

## Observability

- **Pattern**: Structured JSON logging with correlation IDs propagated across
  the Lending → Catalog service call.

## Inter-Service Communication

- **Pattern**: Synchronous HTTP (httpx) from Lending to Catalog for availability
  checks, with timeouts and defensive error handling.
