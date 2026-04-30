---
name: pre-commit-lint-format
description: Ensures code passes lint, format, and type checks so commits succeed. Runs the same steps as the Husky pre-commit hook. Use when preparing a commit, fixing pre-commit failures, or when the user asks to lint/format or make commits pass.
---

# Pre-commit Lint & Format

Keeps code aligned with the project's pre-commit hook so commits pass cleanly. The hook lives at **`.husky/pre-commit`** relative to the **workspace root** (the directory that contains root `package.json` and `.husky/`).

If your repo nests multiple packages without Husky at root, `cd` to the package that actually owns `.husky/` before running these commands.

## Where to run commands

From the **workspace root** that contains `package.json`, `.husky/`, and `lint-staged` config:

```bash
cd <workspace-root>
```

## Pre-commit steps (match `.husky/pre-commit`)

Run in order. If any step fails, fix before committing.

### 1. Lint and format (lint-staged)

Runs ESLint with auto-fix and Prettier on staged files (per `lint-staged` in `package.json`).

```bash
npx lint-staged
```

Optional full-repo cleanup (if scripts exist):

```bash
npm run lint -- --fix   # or pnpm/yarn equivalent
npm run format
```

**Typical lint-staged shape:** `*.{ts,tsx}` → `eslint --fix` + `prettier --write`; other globs → Prettier. **Read the actual `package.json`** in this repo.

### 2. TypeScript (type check)

Discover every `tsconfig.app.json` under `apps/` (pattern may differ — some projects use `tsconfig.json` per app):

```bash
for tsconfig in apps/*/tsconfig.app.json; do
  [ -f "$tsconfig" ] || continue
  echo "Type checking $tsconfig..."
  npx tsc -p "$tsconfig" --noEmit
done
```

Or run explicit entries if `.husky/pre-commit` lists them:

```bash
npx tsc -p apps/{name}-api/tsconfig.app.json --noEmit
npx tsc -p apps/{name}-web/tsconfig.app.json --noEmit
```

All must exit 0. When adding apps, update `.husky/pre-commit` and this skill’s [reference.md](reference.md).

## Workflow before committing

1. After edits: lint/format + type-check.
2. If Husky failed: read hook output, fix, rerun from the correct root.
3. Before “ready to commit”: ensure the same commands pass locally.

## Quick verification (full pre-commit simulation)

```bash
npx lint-staged && for tsconfig in apps/*/tsconfig.app.json; do npx tsc -p "$tsconfig" --noEmit || exit 1; done
```

(Adjust loop if your apps use different tsconfig filenames.)

## Adding a new app to pre-commit

Append to `.husky/pre-commit`:

```bash
echo "Type checking {new-app}..."
npx tsc -p apps/{new-app}/tsconfig.app.json --noEmit
```

Mirror any project-specific tsconfig naming.

## When to apply this skill

- User is about to commit / wants green Husky
- Fixing lint-staged or type-check failures
- Post-change hygiene before suggesting commit

## Additional resources

- [reference.md](reference.md)
