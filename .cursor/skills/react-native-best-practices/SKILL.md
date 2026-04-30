---
name: react-native-best-practices
description: Applies React Native best practices for structure, performance, lists, navigation, state, and styling. Use when building or refactoring React Native or Expo apps, working with Metro, native modules, or when the user mentions React Native, RN, or Expo.
---

# React Native Best Practices

## When to Apply

- Building or refactoring React Native or Expo applications
- Implementing lists, navigation, or state management
- Optimizing performance or fixing re-render issues
- Styling components or handling platform differences
- Setting up or tuning Metro, Babel, or native config

---

## Project Structure

- **Entry**: Single entry point (`index.js` or `App.tsx`); avoid multiple roots unless using a specific pattern (e.g. storybook).
- **Feature-based folders**: Group by feature/screen (e.g. `screens/`, `components/`, `hooks/`, `utils/`, `navigation/`) or by domain modules.
- **Config at root**: `metro.config.js`, `babel.config.js`, `app.json` / `app.config.js` (Expo) at project root. Use `react-native.config.js` for native asset linking if needed.
- **Path aliases**: Prefer `babel-plugin-module-resolver` or `tsconfig` paths (e.g. `@/components`) to avoid deep relative imports.

---

## Components and Hooks

- **Functional components only**: Use function components and hooks; avoid class components for new code.
- **Extract list item components**: For `FlatList`/`SectionList`, render a dedicated item component and pass data via props so list items can be memoized independently.
- **Memoization**: Use `React.memo` for list item components and pure presentational components. Use `useCallback` for callbacks passed to memoized children or to list `renderItem`; use `useMemo` for derived data or expensive computations passed as props.
- **Avoid inline object/array creation in render**: Pass stable references (from `useMemo`/`useCallback` or module-level constants) to avoid breaking memoization and causing extra re-renders.

---

## Lists (FlatList / SectionList)

- **Prefer FlatList/SectionList**: Never map over large arrays to render a long list of components; use `FlatList` or `SectionList` for virtualized lists.
- **Stable `keyExtractor`**: Provide a `keyExtractor` that returns a unique string (e.g. `item.id`). Never use array index if list can be reordered or filtered.
- **`getItemLayout` when possible**: If item height is fixed (or predictable), provide `getItemLayout` to skip measurement and improve scroll performance.
- **`windowSize` / `maxToRenderPerBatch`**: Tune for long lists; reduce `windowSize` on low-end devices if needed.
- **Avoid anonymous functions in props**: Pass `renderItem`, `keyExtractor`, etc. with `useCallback` so list doesn’t re-render unnecessarily.

---

## Navigation (React Navigation)

- **Single navigator root**: Use one root navigator (stack, tab, or drawer); nest navigators inside screens when needed.
- **Type-safe params**: Define param lists with TypeScript and use `NativeStackScreenProps` or `CompositeScreenProps` for typed `navigation` and `route`.
- **Screen options**: Prefer `options` per screen; use `screenOptions` for shared config. Avoid defining heavy components inline in `options`; use a component reference or `useCallback` to prevent re-creating on each render.
- **Deep linking**: Configure `linking` in the navigator and match paths to screen names for consistent URLs.

---

## State and Data

- **Local first**: Use `useState`/`useReducer` for local UI state; lift state only when multiple components need it.
- **Context**: Use for theme, auth, or app-wide config; split contexts by concern to avoid broad re-renders. Consider storing only minimal data in context and deriving the rest in consumers.
- **Server state**: Prefer a data library (e.g. TanStack Query, SWR) for fetching, caching, and refetching instead of ad-hoc `useEffect` + `useState`.
- **Avoid storing derived data**: Compute derived values in render or with `useMemo` instead of duplicating in state.

---

## Styling

- **StyleSheet.create**: Use `StyleSheet.create()` for style objects to enable optimizations and avoid inline style objects when possible.
- **Platform-specific**: Use `Platform.OS`, `Platform.select()`, or `.ios.js`/`.android.js` style files when design differs per platform.
- **Safe area**: Use `SafeAreaView` from `react-native-safe-area-context` (and wrap app with `SafeAreaProvider`) for notched devices; avoid deprecated `SafeAreaView` from React Native for new code.
- **Flexbox**: Prefer flex for layout; avoid fixed dimensions when responsive behavior is needed. Use `flex: 1` for fill-remaining-space patterns.

---

## Performance

- **Hermes**: Enable Hermes in `app.json` or native config for better startup and memory on supported versions.
- **Images**: Use `resizeMode` appropriately; prefer fixed or bounded dimensions to avoid layout thrash. Consider `react-native-fast-image` or similar for heavy image lists if needed.
- **Lazy loading**: Use `React.lazy` + `Suspense` for heavy screens if using a bundler that supports it; otherwise defer loading of non-critical screens.
- **Avoid heavy work on JS thread**: Move heavy computations off the JS thread (e.g. worker, native module) when they block interactions or animations.
- **Dev vs prod**: Remove or gate `console.*` in production (e.g. babel plugin); use `__DEV__` for dev-only branches.

---

## Native and Platform

- **Native modules**: Prefer community or official libraries (e.g. `react-native-*`) over custom native code unless necessary. Document linking steps (autolinking vs manual) in README.
- **Permissions**: Request permissions at runtime with clear UX (e.g. explain before requesting); handle denied and “don’t ask again” states.
- **Back handler**: Use `BackHandler` (Android) in effects and clean up listeners; respect hardware back for screens that need it.

---

## Testing

- **Unit / component**: Use Jest with React Native Testing Library; render with `render()`, query by role/label, fire events with `fireEvent` or `userEvent`.
- **Avoid implementation details**: Prefer testing behavior and accessibility over internal state or component structure.
- **Mocks**: Mock `react-native` or heavy native modules when needed; use `jest.mock()` for modules that break in Node (e.g. `react-native-reanimated` in Jest).

---

## Common Anti-Patterns

- **Mapping arrays to views**: Don’t `data.map(() => <View />)` for long lists; use `FlatList`/`SectionList`.
- **Anonymous functions in list props**: Don’t pass `renderItem={() => <Item />}`; use a stable callback and memoized item component.
- **Overusing Context**: Don’t put frequently changing data in a single big context; split or use a state library.
- **Inline styles**: Avoid `style={{ flex: 1 }}` in hot paths; use `StyleSheet.create` and reuse.
- **Blocking JS thread**: Avoid synchronous heavy work or large JSON parsing on the main thread during interactions or startup.
- **Ignoring platform**: Don’t assume one platform; test on both iOS and Android and use `Platform` or platform-specific files when behavior or UI differ.

---

## Quick Checklist

When implementing or reviewing React Native code:

- [ ] Long lists use `FlatList`/`SectionList` with `keyExtractor` (and `getItemLayout` if fixed height)
- [ ] List item and callbacks are memoized where it matters
- [ ] No large inline objects/functions in render that break memoization
- [ ] Styles use `StyleSheet.create`; platform differences handled
- [ ] Safe areas and notches handled via `react-native-safe-area-context`
- [ ] Navigation params and options are type-safe and not recreated unnecessarily
- [ ] Server/async state uses a clear pattern (e.g. data library) instead of scattered `useEffect` + `useState`
- [ ] Heavy work is off the JS thread or deferred where appropriate
- [ ] Tests use React Native Testing Library and behavior-focused queries
