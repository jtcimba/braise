# Braise Engineering Guidelines

## Engineering mindset

Think like a distinguished engineer. Prefer the simplest solution that solves the problem correctly. Avoid over-engineering, premature abstraction, and speculative generality. Every line of code added is a line that must be maintained.

## Before writing new code

- Search for existing utilities, components, hooks, or services that already do what's needed. Extend or refactor them before creating something new.
- Check whether an existing component can accept a new prop rather than duplicating it.
- If adding a new file, ask whether the logic belongs in an existing one.

## Code quality

- Run `npx tsc --noEmit` and `npm run lint` after every non-trivial change. Fix all errors and warnings before considering work done.
- Run `npx prettier --write <file>` if you've made significant edits to a file, or if lint reports formatting issues.
- No unused imports, variables, or dead code — remove them immediately.
- Name things for what they are. Avoid generic names like `data`, `item`, `handlePress` unless the scope is tiny.
- Keep components focused. If a component is doing two distinct things, it's a candidate to split.

## React Native specifics

- Use the project's existing theme system (`theme.colors`, `theme.typography`) — never hardcode colors or font sizes.
- Only typography keys that exist: `h1`, `h2`, `h2-emphasized`, `h4`, `h4-emphasized`, `b1`.
- All styles go in `StyleSheet.create` — no inline style objects.
- iOS does not support stacking two `react-native-modal` instances from the same screen. Use a single modal with view-state switching instead.
- Prefer `useCallback` and `useMemo` for handlers and derived values passed as props or used in dependency arrays.

## Reviewing changes

- Check that the diff is minimal — no unrelated formatting changes, no commented-out code, no accidental file inclusions (e.g. `.xcscheme` files).
- Verify error paths: async operations that can throw should have try/catch with user-facing feedback (`Alert.alert`).
- Check that dependency arrays (`useEffect`, `useCallback`, `useMemo`) are complete and correct.
- Confirm new components follow the same patterns as adjacent components (modal style, button style, sheet layout).

## Committing

- Stage only files relevant to the change. Exclude IDE artifacts and unrelated modifications.
- Commit messages should be concise and describe intent, not implementation.
