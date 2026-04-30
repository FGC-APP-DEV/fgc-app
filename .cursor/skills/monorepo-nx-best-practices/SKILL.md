---
name: monorepo-nx-best-practices
description: Applies Nx monorepo best practices for project structure, boundaries, caching, and affected commands. Use when working in or setting up an Nx workspace, adding apps or libs, configuring nx.json or project.json, or when the user mentions Nx, monorepo, or affected builds.
---

# Nx Monorepo Best Practices

## When to Apply

- Adding or refactoring apps or libraries in an Nx workspace
- Configuring or tuning `nx.json`, `project.json`, or target defaults
- Enforcing dependency boundaries or tags
- Using `nx affected`, caching, or task pipelines
- Reviewing or improving monorepo structure

---

## Project Structure

- **Apps** in `apps/` (deployable: web, api, mobile). One `project.json` per app.
- **Libs** in `libs/` (shared code). Group by domain or scope, e.g. `libs/shared`, `libs/auth`, `libs/users`.
- **Root config**: `nx.json` at workspace root; optional `tsconfig.base.json` for path aliases.
- Prefer **one library per folder**; use `directory` when generating (e.g. `libs/auth` not a flat `auth`).
- Keep **buildable libs** with explicit `build` targets and `outputPath` so apps can depend on them via `^build`.

---

## Tags and Boundaries

- Add **tags** in each `project.json`: at least `scope:<scope>` and optionally `type:util|data|ui|feature`.
- Use **boundary rules** in `.eslintrc.json` or `@nx/enforce-module-boundaries` to enforce:
  - Libs with `scope:shared` only depend on other shared/util libs.
  - App-specific libs (e.g. `scope:auth`) do not import from other domain libs unless allowed.
- Example tags: `["scope:shared", "type:util"]`, `["scope:auth", "type:feature"]`.

---

## nx.json Conventions

- **defaultBase**: Set to main integration branch (e.g. `main`) so `nx affected` compares against it.
- **namedInputs**: Define `default` (all project files) and `production` (exclude tests/specs) for cache inputs.
- **targetDefaults** (shared for all projects):
  - **build**: `dependsOn: ["^build"]`, `inputs: ["production", "^production"]`, `cache: true`, explicit `outputs`.
  - **test**: `inputs: ["default", "^production"]`, `cache: true`.
  - **lint**: `inputs: ["default", "{workspaceRoot}/.eslintrc.json"]`, `cache: true`.
- Use **outputs** on every cached target so cache keys are correct (e.g. `["{options.outputPath}"]` or `["{workspaceRoot}/coverage/{projectRoot}"]` for test).

---

## Caching and Affected

- Run **affected** for CI and local verification: `nx affected -t build`, `nx affected -t test`, `nx affected -t lint`.
- Rely on **local cache** so repeated runs skip work; use `nx reset` only when cache is suspect.
- For **CI**: set `NX_DAEMON=false` and use `nx affected --base=origin/main` (or similar) so only changed projects run.
- Avoid committing `.nx/cache`; use Nx Cloud or similar for distributed cache if needed.

---

## Dependency Graph and Build Order

- **Build order** is inferred from `dependsOn: ["^build"]`: libs build before apps that depend on them.
- Use **nx graph** to visualize and verify dependencies; fix cycles by extracting shared code or inverting dependencies.
- Prefer **library imports** via path aliases (e.g. `@repo/shared`, `@repo/auth`) defined in `tsconfig.base.json`; avoid relative imports across lib boundaries when a proper lib exists.

---

## project.json Per Project

- **name**: Must match the project key (folder or name used in `nx run <name>`).
- **sourceRoot**: Set for libs (e.g. `libs/shared/src`).
- **projectType**: `"library"` or `"application"`.
- **targets**: Reuse executors (`@nx/js:tsc`, `@nx/jest:jest`, `@nx/eslint:lint`, `@nx/webpack:*`, `nx:run-commands`) and only override when necessary.
- Prefer **targetDefaults** in `nx.json` for shared options; put project-specific options (e.g. `main`, `tsConfig`, `outputPath`) in `project.json`.

---

## Adding New Libs or Apps

- **New lib**: `nx g @nx/js:library <name> --directory=libs/<name> --importPath=@repo/<name> --buildable` (or equivalent for React/Node). Add tags, then wire `build`/`test`/`lint` if not defaulted.
- **New app**: Use the appropriate generator (`@nx/node:application`, `@nx/webpack:application`, etc.) and place under `apps/`. Add app-specific targets (serve, build) and set `dependsOn` for build.
- After adding, run `nx graph` and fix any new boundary violations or cycles.

---

## Quick Checklist

- [ ] Apps in `apps/`, libs in `libs/` with clear naming
- [ ] Tags on every project; boundary rules in ESLint
- [ ] `nx.json` has `defaultBase`, `namedInputs`, and `targetDefaults` for build/test/lint
- [ ] Cached targets have explicit `outputs`
- [ ] Build targets use `dependsOn: ["^build"]`
- [ ] CI uses `nx affected` with correct `--base`
- [ ] No circular dependencies; path aliases used for cross-lib imports
