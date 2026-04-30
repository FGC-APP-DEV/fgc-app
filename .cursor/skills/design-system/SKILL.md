---
name: design-system
description: Discovers this workspace’s theme tokens and shared UI primitives so new code stays visually consistent. Use when styling UI, adding components, or transposing legacy CSS/Tailwind into themed components — instead of guessing colors or typography.
---

# Design System Discovery

This skill is **workspace-agnostic**. It tells you **how** to find the authoritative theme and UI layer for _this_ repository. It does **not** hardcode brand colors, logos, or product names.

## Goals

1. Reuse existing primitives (`Button`, `Input`, typography wrappers, layout shells) whenever possible.
2. Prefer **semantic tokens** (primary, danger, spacing scale) over literals (`#3498db`, arbitrary `margin: 17px`).
3. Keep parity with whichever Atomic Design convention the repo follows (atoms/molecules/organisms) **if present** — otherwise follow the project's existing folder structure.

## Discovery Checklist

Run these lookups before building new UI:

1. **UI package root**
   - Search for `libs/ui`, `packages/ui`, or similar.
   - Read `package.json` `name` field and `tsconfig.base.json` path alias (e.g. `@org/ui`).

2. **Theme / tokens**
   - Look for files named `theme.ts`, `tokens.ts`, `colors.ts`, `spacing.ts`, or `tailwind.config.*` at workspace or app root.
   - If using CSS variables, search for `--color-`, `--spacing-`, etc.

3. **Reference implementations**
   - Open 2–3 existing screens in `apps/*/src` that match the desired density (marketing vs dense dashboard).
   - Copy import patterns (`import { Button } from '@scope/ui'` style) instead of introducing new pathways.

4. **Storybook / docs (optional)**
   - If `.storybook/` exists, skim stories for canonical usage examples.

## Rules While Implementing

- **Prefer imports from the shared UI lib** over rewriting primitives.
- **Map Tailwind-ish utility thinking** to token scale (spacing, radius, typography) exposed by this repo — see conversion tables inside `app-transposition/reference.md` for the *conceptual* mapping, then apply *this* project's token names.
- **Accessibility:** reuse focus styles, contrast-safe pairings, and hit-area conventions from existing components.

## When You Truly Need a New Component

1. Decide atomic level consistent with sibling components.
2. Build it **only from tokens** exported by the UI/theme module.
3. Export via the same barrel files (`index.ts`) used elsewhere in that library.
4. Add tests if the repo requires them for UI libs.

## Related Skills / Files

| Resource                  | Use for                               |
| ------------------------- | ------------------------------------- |
| `app-transposition`       | Broader migration workflow            |
| `react-native-best-practices` | RN-specific layout/perf guidance  |
| `nx-generate`             | Scaffolding a new UI lib if justified |

## Anti-Patterns

- Hardcoding hex/rgba when tokens exist.
- Forking `Button`/`TextField` into every feature lib.
- Mixing competing styling systems (e.g. inline magic numbers + design tokens) in the same component without a documented reason.
