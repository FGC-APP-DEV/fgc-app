# Transposition Checklist: {App Name}

Copy this checklist into the transposition plan and check off items as you complete them.

**Imports:** Resolve real `@{scope}/...` aliases from `tsconfig.base.json`; do not hardcode vendor names.

---

## Phase 1: Discovery

- [ ] Legacy app scanned (package.json, routes, components, lib, db, auth, tests)
- [ ] Tech stack identified
- [ ] Discovery report generated and presented to user
- [ ] User confirmed discovery is complete

## Phase 2: Architecture Mapping

- [ ] mapping-template.md filled out with all artifacts
- [ ] Every legacy artifact assigned to a monorepo target
- [ ] Existing libs identified for reuse (ui, auth, shared, graphql, database — whichever exist)
- [ ] Existing libs identified for extension (with specific additions listed)
- [ ] New libs identified (with justification)
- [ ] New apps identified (web, api, mobile) as applicable
- [ ] Dependency graph documented
- [ ] API endpoint mapping complete (legacy HTTP → workspace API style: GraphQL / REST / other)
- [ ] Screen/page mapping complete (legacy routes → workspace screens/pages)

## Phase 3: Planning

- [ ] Implementation plan generated in dependency order
- [ ] transposition-plan.md created in docs/{app-name}/
- [ ] Plan presented to user
- [ ] User approved the plan

## Phase 4: Scaffolding

- [ ] New libs created via Nx generators
- [ ] New apps created via Nx generators
- [ ] project.json configured with correct tags for each new project (match repo conventions)
- [ ] tsconfig.base.json updated with new path aliases
- [ ] Barrel exports (index.ts) created for each new lib
- [ ] Nx workspace compiles without errors after scaffolding

## Phase 5: Implementation

### Database (if applicable)

- [ ] New tables added where the workspace keeps schema (`libs/database/...`)
- [ ] Repositories/data-access aligned with existing patterns
- [ ] Migrations run per project docs / `package.json` scripts (`db:migrate`, etc.)

### Shared

- [ ] Types/validations/utils added under libs/shared (or equivalent)
- [ ] Barrel exports updated

### GraphQL (if applicable)

- [ ] Schema fragments added where workspace stores `.graphql`/SDL
- [ ] Types regenerated per repo script

### API

- [ ] Handlers/resolvers created under `apps/{name}-api/...`
- [ ] Auth guards applied consistently with sibling resolvers/handlers
- [ ] Repositories/services used instead of ad-hoc DB in handlers (match existing style)
- [ ] Shared validations applied at boundaries

### Feature Libs

- [ ] Components use existing primitives from `libs/ui` when available
- [ ] Styling uses theme tokens / design-system guidance (avoid magic colors when tokens exist)
- [ ] Hooks/services mirror client stack already in repo (Apollo, TanStack Query, etc.)

### App Screens / Pages

- [ ] Screens or routes created under `apps/{name}-web/...`
- [ ] Screens compose feature libs rather than importing legacy-relative paths
- [ ] Routing updated (App.tsx, router module, Next routes — match stack)
- [ ] Role/access rules enforced like sibling apps

### Tests

- [ ] API/unit tests aligned with workspace runner (Jest/Vitest)
- [ ] Component tests updated/added
- [ ] Hook/service tests where valuable
- [ ] Validation/repo tests where applicable

## Phase 6: Verification

- [ ] `npx nx run-many --target=test --all` passes (if target exists)
- [ ] `npx nx run-many --target=lint --all` passes
- [ ] Dev server starts without errors
- [ ] Key flows exercised (automated MCP and/or scripted e2e)
- [ ] Visual checks against design-system expectations
- [ ] No regressions in existing features touched

## Phase 7: Quality Gate

- [ ] `npx lint-staged` passes (when run from correct root)
- [ ] Required `tsc --noEmit` checks pass per app configs
- [ ] `.husky/pre-commit` updated if new apps need type-check inclusion
- [ ] No lint/TS/format issues blocking commit
- [ ] Imports use workspace path aliases (`tsconfig.base.json`), not brittle cross-lib relatives

## Post-Transposition

- [ ] docs/{app-name}/ updated / plan marked complete
- [ ] Legacy tree archived or deletion plan agreed
- [ ] User notified
