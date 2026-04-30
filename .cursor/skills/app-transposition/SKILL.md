---
name: app-transposition
description: Transposes any legacy app into this Nx monorepo architecture. Covers discovery, architecture mapping, planning, scaffolding, implementation, verification, and quality gates. Use when migrating a legacy app, transposing code from a standalone project into the monorepo, or when the user asks to integrate an external app into the workspace.
---

# App Transposition

Systematically transpose a legacy application into **this workspace’s** Nx monorepo.

**Important:** Resolve real package names from `tsconfig.base.json` path aliases (and/or `libs/*/package.json` `name` fields). Placeholders below use `{org}` / `{scope}` — replace with whatever this repo uses (for example `@acme/database`, `@repo/ui`).

This skill is **source-framework-agnostic** — it works with Next.js, Express, CRA, Vite, mobile shells, etc.

## Monorepo Architecture (Typical Target)

Adapt folder names if your workspace differs; discover actual layout with `nx show projects`.

```
{workspace-root}/
├── apps/
│   ├── {name}-web/        # Thin shell — imports from libs, adds routing + config
│   ├── {name}-mobile/     # (optional) React Native shell
│   └── {name}-api/        # Thin API shell — handlers/resolvers import from libs
├── libs/
│   ├── shared/            # @{org}/shared — types, utils, validations, constants (name varies)
│   ├── graphql/           # @{org}/graphql — schema, client, generated types (if GraphQL is used)
│   ├── ui/                # @{org}/ui — design system / components
│   ├── auth/              # @{org}/auth — auth provider, hooks, guards
│   ├── users/             # @{org}/users — user domain (example; may not exist)
│   ├── database/          # @{org}/database — ORM schema, repositories (if present)
│   └── {feature}/         # @{org}/{feature} — feature-specific lib
```

**Key rule:** Apps stay thin. Most logic lives in `libs/`. Feature libs stay self-contained and reusable across surfaces when applicable.

### Import Aliases

Do **not** hardcode a vendor prefix. Build the table from `tsconfig.base.json` `compilerOptions.paths` (or package exports). Example shape:

| Lib folder     | Typical import alias     |
| -------------- | ------------------------ |
| `libs/shared`  | `@{org}/shared`          |
| `libs/graphql` | `@{org}/graphql`     |
| `libs/ui`      | `@{org}/ui`              |
| `libs/auth`    | `@{org}/auth`            |
| `libs/database`| `@{org}/database`        |
| `libs/{feature}` | `@{org}/{feature}`     |

---

## Phase 1: Discovery

Scan the legacy app and produce a structured report.

### What to Scan

1. **`package.json`** — name, dependencies, devDependencies, scripts
2. **Framework** — Next.js (`next.config`), Express (`app.listen`), CRA (`react-scripts`), Vite, etc.
3. **Pages/Routes** — `src/app/*/page.tsx`, `src/pages/*`, `routes/*`, etc.
4. **API Endpoints** — `src/app/api/*`, `routes/*.ts`, Express routers, server actions, etc.
5. **Components** — group by domain (admin, user, common, ui, layout)
6. **Lib/Utils** — auth, db, hooks, validations, utils, config
7. **Types** — `src/types/*`, inline types, `.d.ts` files
8. **Tests** — unit (`*.test.ts`), e2e (`*.spec.ts`, Playwright), integration
9. **Database** — schema files, migrations, ORM config (Drizzle, Prisma, etc.)
10. **Auth** — provider (NextAuth, Firebase, custom JWT), OAuth config, middleware
11. **Config** — `.env*`, `tsconfig.json`, ESLint, Prettier, Docker
12. **Static assets** — images, fonts, public folder

### Discovery Report Format

```markdown
# Discovery Report: {App Name}

## Tech Stack

- Framework:
- Auth:
- Database:
- UI:
- Testing:

## Pages/Routes ({count})

| Route | File | Role Required | Purpose |
| ----- | ---- | ------------- | ------- |

## API Endpoints ({count})

| Method | Route | Auth | Purpose |
| ------ | ----- | ---- | ------- |

## Components ({count})

| Component | Domain | Legacy Path |
| --------- | ------ | ----------- |

## Hooks ({count})

| Hook | Purpose | Legacy Path |
| ---- | ------- | ----------- |

## Database Tables ({count})

| Table | Columns | Relations |
| ----- | ------- | --------- |

## Validations ({count})

| Schema | Purpose | Legacy Path |
| ------ | ------- | ----------- |

## Utils ({count})

| Util | Purpose | Legacy Path |
| ---- | ------- | ----------- |

## Business Rules

- {Rule 1}
- {Rule 2}
```

Present this report to the user. Get confirmation before Phase 2.

---

## Phase 2: Architecture Mapping

Map every legacy artifact to its monorepo target. Read and fill [mapping-template.md](mapping-template.md).

### Standard Mapping Rules (adjust to this repo)

| Legacy Pattern                               | Typical Nx target                               | Rationale                                      |
| -------------------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| `src/app/api/*` or Express routes            | `apps/{name}-api/src/...` (resolvers/handlers)  | Map to whatever API style this workspace uses |
| `src/components/ui/*` primitives             | `libs/ui/` (reuse)                              | Avoid duplicating primitives                   |
| `src/components/{feature}/*`               | `libs/{feature}/src/components/`               | Feature UI                                     |
| `src/components/layout/*`                  | `libs/ui/` (organisms/layout)                   | Matches many design-system layouts             |
| `src/lib/auth/*`                           | `libs/auth/`                                     | Central auth                                   |
| `src/lib/db/*`                             | `libs/database/`                                | Shared data layer                              |
| `src/lib/hooks/*`                          | `libs/{feature}/src/services/`                  | Feature hooks/services                         |
| `src/lib/validations/*`                    | `libs/shared/src/validations/`                  | Shared validation                              |
| `src/lib/utils/*`                          | `libs/shared/src/utils/`                         | Shared utils                                   |
| `src/types/*`                              | `libs/shared/src/types/`                         | Shared types                                   |
| `src/middleware.ts`                        | `libs/auth/` + route guards                     | Matches common patterns                        |
| Page components                             | `apps/{name}-web/src/screens/` (or pages/ route)| App shell                                       |

### Decision Process for Each Artifact

Resolve `{ui}`, `{auth}`, `{database}`, `{shared}` imports from **`tsconfig.base.json`**.

```
Is this a UI primitive already in libs/ui?
  YES → Import from @{org}/ui (actual alias from tsconfig). Do NOT fork primitives.
  NO  ↓

Is this authentication / authorization logic?
  YES → Extend libs/auth using the workspace’s patterns.
  NO  ↓

Is this DB schema/query/repository?
  YES → Extend libs/database (or the repo’s data lib) consistently.
  NO  ↓

Is this shared type, util, validation, or constant?
  YES → Add under libs/shared (or equivalent shared lib).
  NO  ↓

Feature-specific UI + hooks/services?
  YES → libs/{feature}/
  NO  ↓

Page / screen shell?
  YES → apps/{name}-web/ (import from libs)
```

### New Lib Criteria

Create a new lib only when:

- The feature is self-contained (components + hooks/services)
- It could be reused by another app in the monorepo
- It does NOT already exist

### Naming Convention

- Folder: `libs/{kebab-feature}`
- Import path: whatever Nx/`tsconfig.base.json` uses (`--importPath` when generating)
- Tags: match existing projects (commonly `scope:shared,type:feature` or repo-specific equivalents)

---

## Phase 3: Planning

Generate an ordered implementation plan that matches **this repository’s layers** (GraphQL vs REST vs other).

### Typical Dependency Order (when GraphQL + DB exist)

```
1. libs/database/       ← schema + repositories (skip if not used)
2. libs/shared/         ← types, validations, utils
3. libs/graphql/        ← schema + codegen (skip if REST-only)
4. apps/{name}-api/     ← resolvers/handlers
5. libs/{feature}/      ← UI + hooks consuming API client
6. apps/{name}-web/     ← screens/pages
7. apps/{name}-mobile/ ← optional
```

When the workspace does not use GraphQL, replace steps 3–4 with REST route modules, RPC, etc., following sibling apps.

### Plan Output

Create `docs/{app-name}/transposition-plan.md` with checklists analogous to:

- DB tables / repos (if any)
- Shared types/validations/utils
- API contract updates (GraphQL `.graphql`, OpenAPI, etc.)
- API implementation files under `apps/{name}-api/`
- Feature lib components + hooks
- Web/mobile shells and routing

**STOP HERE** — present the plan and wait for user approval.

---

## Phase 4: Scaffolding

After approval, create structure with Nx generators. **Match import paths** to existing repos.

### New Libs

Use the `nx-generate` skill. Example shape (substitute `{org}` and plugin to match workspace):

```bash
npx nx g @nx/js:library {name} \
  --directory=libs/{name} \
  --importPath=@{org}/{name} \
  --tags="scope:shared,type:feature"
```

### New Apps

```bash
# Web — pick generator aligned with workspace (Webpack/Vite/etc.)
npx nx g @nx/react:application {name}-web \
  --directory=apps/{name}-web \
  --tags="scope:app,type:web"

# API
npx nx g @nx/node:application {name}-api \
  --directory=apps/{name}-api \
  --tags="scope:app,type:api"
```

### After Scaffolding

1. Ensure `tsconfig.base.json` path entries match `--importPath` (generators usually add them).
2. Barrel exports in `libs/{name}/src/index.ts` as needed.
3. Set up `project.json` targets consistently with sibling libs.

---

## Phase 5: Implementation

Transpose code feature by feature, following the approved plan.

### Per-Feature Workflow

1. Read the legacy source file
2. Identify the target location from the mapping
3. Convert (see [reference.md](reference.md)); **swap illustrative `@org/...` placeholders for your actual path aliases**
4. Write colocated tests (`*.spec.ts`)
5. Update barrel exports
6. Verify imports use workspace aliases — never `../../../` across lib boundaries

### Conversion Rules (adapt stack)

**HTTP → API layer:** Map REST to GraphQL resolvers **or** to the existing REST pattern in `apps/{name}-api/` — pick what this monorepo already does.

**UI:** If the workspace targets React Native / RN Web, use shared UI from `libs/ui` and **`design-system`** for tokens. For DOM-only React, use the project’s CSS/Tailwind/styled pattern.

**Hooks / data:** If the codebase uses Apollo, use `useQuery`/`useMutation`. If it uses TanStack Query, REST clients, etc., mirror existing apps.

**Database:** Extend the ORM/schema location used by `libs/database` (path may differ slightly — follow imports in existing repositories).

---

## Phase 6: Verification

Run the `legacy-transposition-verification` skill. At minimum:

1. **Unit tests:** `npx nx run-many --target=test --all` (when present)
2. **Lint:** `npx nx run-many --target=lint --all`
3. **Manual / MCP:** Exercise main flows via Playwright MCP or project e2e tests
4. **Visual checks:** Puppeteer/screenshots where applicable

Fix all failures before proceeding.

---

## Phase 7: Quality Gate

Run the `pre-commit-lint-format` skill from **the workspace root** (where `package.json` + Husky live):

```bash
npx lint-staged
npx tsc -p apps/{name}-api/tsconfig.app.json --noEmit
npx tsc -p apps/{name}-web/tsconfig.app.json --noEmit
```

Adjust `tsconfig` paths if apps use different config names.

Then:

1. Fix any remaining errors
2. Update `.husky/pre-commit` for new apps if required
3. Verify [checklist.md](checklist.md)
4. Report completion

## Additional Resources

- [reference.md](reference.md)
- [mapping-template.md](mapping-template.md)
- [checklist.md](checklist.md)
