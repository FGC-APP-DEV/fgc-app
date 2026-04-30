---
name: legacy-transposition-verification
description: After transposing features from a legacy app to the current web app, runs Playwright tests and confirms interface behavior and style with Puppeteer via MCPs. Use when performing a transposition, migrating from a legacy codebase to the current project, or when the user asks to verify transposed web behavior or style.
---

# Legacy Transposition Verification

When you complete a transposition from a **legacy app** to the **current** project (web surface), run automated checks and confirm the interface so behavior and style match expectations.

## When This Applies

- Code was transposed from a legacy codebase into the current web app.
- The user asks to verify parity with legacy behavior or style.
- Tasks described as "transposition" / "migrate from legacy" for the web app.
- Phase 6 of the `app-transposition` skill workflow.

## Discovering the Dev Server Port

Before MCP tools, determine the dev server URL:

1. Check the target app's resolved Nx config:
   ```bash
   npx nx show project {app-name}-web --json
   ```
   Inspect `.targets.serve.options` for `port`, `host`, etc.
2. Also check `webpack.config.js`, `vite.config.ts`, or framework docs.
3. Framework defaults: Webpack dev server often `3000`, Vite `5173`, Next.js `3000`.
4. Follow `.cursor/rules/LOCALHOST.md`: use the native port; if busy, free it and restart — do not silently pick a new port.

Start the dev server before MCP tools when needed:

```bash
npx nx serve {app-name}-web
```

## Required Steps

### 1. Run Nx test and lint targets

```bash
npx nx run-many --target=test --all
npx nx run-many --target=lint --all
```

Skip or adjust if a target does not exist. Fix failures before deeper UI verification.

### 2. Run tests with Playwright

- **Project Playwright tests** (`e2e/`, `tests/e2e/`, `*.e2e.ts`): run via `package.json` script or `npx playwright test`.
- **Playwright MCP** (`user-playwright`): navigate, snapshot, run code-based checks per MCP schema.

### 3. Confirm the interface with Puppeteer

Use **Puppeteer MCP** (`user-puppeteer`) when available:

- Navigate key routes and replay flows (clicks, forms, hovers, selects).
- Screenshots for layout/typography regression signals.
- `puppeteer_evaluate` for DOM/computed-style assertions when needed.

### 4. Side-by-side comparison (optional)

If legacy still runs locally:

1. Legacy on its **native** port (example: `http://localhost:3001`).
2. New app on its port (example: `http://localhost:3000`).
3. Capture the same routes on both; compare structure and visual hierarchy.
4. **Expectations:** functional equivalence and compliance with **this workspace’s design system** — exact pixel parity is rarely required unless the user demands it.

### 5. Use MCPs, not assumptions

Prefer MCP tools (or real test runs) over guessing. Confirm server names / tool names against your local MCP configuration.

## Checklist

- [ ] `nx` test + lint targets pass (or documented exceptions).
- [ ] Dev server starts cleanly for the target app.
- [ ] Playwright coverage (project tests and/or MCP) passes.
- [ ] Puppeteer (or equivalent) used for critical UI flows when MCP is available.
- [ ] Visual review against design-system guidance.
- [ ] Optional side-by-side with legacy when runnable.
- [ ] `app-transposition/checklist.md` updated if part of a full transposition.

## Summary

**Legacy → current web transposition** should include automated checks plus real UI verification (Playwright project tests and/or MCPs). Do not skip executable verification steps when tooling is configured.
