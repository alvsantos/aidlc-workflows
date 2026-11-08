# Logical Components — System-Wide

System-wide logical components derived from the NFR design patterns. These are
shared concerns mapped across both units before per-unit code generation.

## Shared Cross-Cutting Components

| Component | Responsibility | Used By |
|---|---|---|
| Auth middleware | JWT validation, role extraction | Lending (primary), Catalog (read scopes) |
| `require_role` dependency | RBAC enforcement on routes | Both services |
| Repository base | Abstract data-access contract | Both services |
| In-memory repository | MVP storage implementation | Both services |
| Error handler registry | Domain-error → HTTP mapping | Both services |
| Structured logger | JSON logs with correlation IDs | Both services |
| Catalog HTTP client | Availability lookups | Lending service |

## Per-Unit Mapping

- **Catalog Service**: repository base + in-memory repo, error handlers,
  structured logger, read-scope auth.
- **Lending Service**: full auth middleware + RBAC, repository base + in-memory
  repo, error handlers, structured logger, Catalog HTTP client.

Each unit realizes these logical components in its own `code/` during Code
Generation.
