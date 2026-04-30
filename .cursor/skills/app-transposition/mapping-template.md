# Architecture Mapping: {App Name}

Fill this template during Phase 2. Replace `{placeholders}` with actual values from the discovery report.

**Alias rule:** Substitute `{org}` with whatever appears in `tsconfig.base.json` for this workspace (for example `@acme/ui`, `@repo/shared`).

---

## Legacy Feature Inventory

List every feature/artifact found during discovery:

| #   | Artifact               | Legacy Path                                     | Type                                    | Domain        |
| --- | ---------------------- | ----------------------------------------------- | --------------------------------------- | ------------- |
| 1   | {e.g., UserManagement} | {e.g., src/components/admin/UserManagement.tsx} | {component/hook/util/type/route/schema} | {e.g., admin} |
| 2   |                        |                                                 |                                         |               |
| 3   |                        |                                                 |                                         |               |

---

## Target Assignment

Map each artifact to its monorepo destination:

| #   | Artifact               | Target Lib/App     | Target Path                                          | Action                |
| --- | ---------------------- | ------------------ | ---------------------------------------------------- | --------------------- |
| 1   | {e.g., UserManagement} | {e.g., libs/users} | {e.g., libs/users/src/components/UserManagement.tsx} | {create/extend/reuse} |
| 2   |                        |                    |                                                      |                       |
| 3   |                        |                    |                                                      |                       |

**Action legend:**

- **create** — new file in a new or existing lib
- **extend** — modify an existing file to add functionality
- **reuse** — no changes needed, import the existing artifact as-is

---

## Lib Decisions

### Existing Libs to Reuse (no changes)

| Lib folder | Import alias `{example}`                      | Artifacts Reused                                          |
| ---------- | --------------------------------------------- | --------------------------------------------------------- |
| ui         | `@{org}/ui`                                   | {e.g., Button, Card, Input, Modal}                        |
| auth       | `@{org}/auth`                                 | {e.g., AuthProvider, useAuth, guards}                     |
| shared     | `@{org}/shared`                               | {e.g., helpers, enums, validators}                         |

_Use real alias strings from `tsconfig.base.json` instead of placeholders in your final mapping._

### Existing Libs to Extend

| Lib folder | Import alias `{example}` | What to Add                          | Why                                        |
| ---------- | ------------------------ | ------------------------------------ | ------------------------------------------ |
| database   | `@{org}/database`        | tables/repos/migrations              | Persistent model changes                   |
| shared     | `@{org}/shared`          | validations/types/utils              | Cross-cutting payloads                     |
| graphql    | `@{org}/graphql`        | SDL/operations/codegen hooks         | If GraphQL powers the API/client           |

### New Libs to Create

| Lib Name  | Planned import path (`--importPath`) | Tags (match repo style)             | Contents                        | Why                       |
| --------- | ------------------------------------ | ----------------------------------- | ------------------------------- | ------------------------- |
| {feature} | `@{org}/{feature}`                   | scope:shared, type:feature (example)| components + hooks/services      | Bounded domain/feature    |

### New Apps to Create

| App Name   | Type | Tags                 | Purpose                            |
| ---------- | ---- | -------------------- | ---------------------------------- |
| {name}-web | web  | scope:app, type:web  | SPA / RN-web shell                  |
| {name}-api | api  | scope:app, type:api  | Backend boundary                    |

---

## Dependency Graph

Show how new/extended libs depend on each other (trim layers you don’t use — e.g. skip graphql if REST-only):

```
libs/database → foundation (optional)
libs/shared   → foundation
libs/graphql  → depends on shared (optional)
libs/auth     → depends on shared (+ graphql/client if applicable)
libs/{feature}→ depends on shared, ui (+ graphql/client if applicable)
apps/{name}-api → database/shared/graphql/auth/resolvers-or-handlers
apps/{name}-web → feature libs/auth/ui/shared
```

---

## API Endpoint Mapping

**GraphQL-heavy workspace example** — rename columns if mapping to REST routers instead.

| Legacy Method | Legacy Route    | Operation style      | Workspace surface / field | Implementation file hint        |
| ------------- | --------------- | -------------------- | ------------------------- | -------------------------------- |
| GET           | /api/items      | Query                | items                     | item.resolvers.ts / handler.ts   |
| POST          | /api/items      | Mutation / POST      | createItem                | same                             |

---

## Screen Mapping

| Legacy Route | Legacy File                | Workspace screen component | Workspace path                                         | Notes                    |
| ------------ | -------------------------- | -------------------------- | ------------------------------------------------------ | ------------------------ |
| /dashboard   | src/app/dashboard/page.tsx | DashboardScreen            | apps/{name}-web/src/screens/DashboardScreen.tsx (etc.) | Match router conventions |

---

## Notes

- {Edge cases / deviations / nonstandard legacy artifacts}
