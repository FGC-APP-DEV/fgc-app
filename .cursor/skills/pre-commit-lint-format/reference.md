# Pre-commit reference

## Source of truth

- **Hook script**: `.husky/pre-commit` at the **workspace root** (the directory with root `package.json`)
- **lint-staged config**: root `package.json` → `"lint-staged"`
- **Husky setup**: usually `npm run prepare` → `husky` (confirm in `package.json`)

## Hook contents (example pattern)

1. `npx lint-staged`
2. One or more `npx tsc -p apps/<project>/tsconfig.app.json --noEmit` lines

If any step exits non-zero, the commit aborts.

**Your repo may differ** — open `.husky/pre-commit` and mirror it here when it changes.

## Useful package.json scripts (typical)

- `npm run format` / `format:check`
- `npm run lint`
- `nx run-many --target=lint --all`

When new deployable apps should be type-checked pre-commit, update `.husky/pre-commit` **and** this reference with their tsconfig paths.
