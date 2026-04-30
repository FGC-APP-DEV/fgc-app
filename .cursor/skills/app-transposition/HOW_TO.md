# How to Transpose a Legacy App into This Nx Monorepo

This guide explains how to use the **app-transposer** agent and the **app-transposition** skill to migrate a standalone legacy app into **this workspace**.

---

## Prerequisites

1. Dependencies installed at the workspace root (`npm install` / `pnpm install` — match the repo’s package manager via lockfile).
2. Legacy app source code available locally (path of your choosing).
3. Cursor opened on **this repo root** so `.cursor/skills/` resolve correctly.
4. Optional: Playwright/Puppeteer/Nx MCPs configured for richer verification.

---

## Quick Start

### Option A: Use the App Transposer (Recommended)

Open Cursor Agent mode and say:

```
Transpose the legacy app at "../path/to/MY_LEGACY_APP/" into this monorepo as "{app-name}".
Use the app-transposer agent.
```

### Option B: Manual Workflow with the Skill

```
Read the app-transposition skill and follow Phase 1 for the app at "../path/to/MY_LEGACY_APP/".
```

Then drive subsequent phases explicitly.

---

## Step-by-Step Walkthrough

### 1. Place the Legacy Source

Example layout (adjust paths freely):

```
{parent-folder}/
├── legacy-app-repo/           # Legacy app folder (SOURCE)
├── this-monorepo/             # Workspace root (TARGET — this repo)
```

### 2. Trigger the Transposition

Provide:

- **Legacy app path**
- **Target app name** in kebab-case
- Constraints (e.g. “no mobile app”, “reuse existing graphql lib”, “REST only”)

### 3. Review the Discovery Report

Confirm completeness; call out exclusions or risky areas.

### 4. Review the Architecture Mapping

Ensure reuse of existing libs (especially `libs/ui`) and justified new libs.

### 5. Approve the Implementation Plan

Only after approval should code change.

### 6. Phases 4–5 (Scaffolding + Implementation)

The agent aligns generators and imports with **your** `tsconfig.base.json` aliases — not a fixed vendor prefix.

### 7. Verification (Phase 6)

Nx test/lint + optional browser MCP flows.

### 8. Quality Gate (Phase 7)

Lint-staged + type-checks + Husky updates if applicable.

---

## Tips

- Prefer **explicit business rules** in prompts so parity checks are clearer.
- Run legacy and new apps on **distinct ports** for comparison (respect the LOCALHOST rule in `.cursor/rules/LOCALHOST.md`).
- Prefer extending existing UI primitives (`libs/ui`) over duplicating Buttons/Inputs/etc.

---

## What the Agent Creates (Typical)

After a successful transposition:

```
{workspace-root}/
├── apps/
│   ├── {name}-web/
│   └── {name}-api/           # When backend is in scope
├── libs/
│   ├── {feature}/            # Often added
│   └── ...                   # Existing libs extended
├── docs/{app-name}/
│   └── transposition-plan.md
└── tsconfig.base.json        # Paths updated as needed
```

---

## Troubleshooting

### Duplicate UI primitives

“In this repo, reuse components from **`libs/ui`** (import alias from tsconfig); don’t recreate Button/Input/Card primitives.”

### Skipped legacy feature

Point the agent at the missed file/folder.

### Type errors after transposition

- Missing exports from `libs/shared`
- Alias not wired in `tsconfig.base.json`
- Missing deps — use `link-workspace-packages` skill for workspace deps

### Tests failing on GraphQL

Ensure mocks/schemas match codegen output; mirror provider setup (`MockedProvider`, etc.) used elsewhere in the repo.

### Husky/pre-commit misses new apps

Ensure `.husky/pre-commit` type-checks match **your** apps’ tsconfig filenames.

---

## Related Skills

| Skill                                   | Purpose                                |
| --------------------------------------- | -------------------------------------- |
| `app-transposition`                     | Full 7-phase workflow                  |
| `app-transposition/reference.md`       | Patterns (swap `{org}` for your scope) |
| `design-system`                         | Theme/token discovery                   |
| `pre-commit-lint-format`               | Lint / format gate                     |
| `legacy-transposition-verification`     | MCP / e2e style verification           |
| `nx-generate` / `nx-workspace`         | Scaffolding + discovery                |
| `react-native-best-practices`          | When mobile surface is RN              |
