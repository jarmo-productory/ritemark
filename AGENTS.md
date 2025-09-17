# Repository Guidelines

## Project Structure & Module Organization
- `ritemark-app/` — Vite + React + TypeScript app. Key folders: `src/components`, `src/lib`, `src/assets`. Unit tests live in `src/*.test.tsx`; integration or exploratory tests may live in `tests/`.
- `docs/` — project notes and reference docs.
- `scripts/` — local helper scripts.
- `.claude`, `.swarm`, `.hive-mind/` — agent/orchestration config; do not change for app features.

## Build, Test, and Development Commands
Run all commands from `ritemark-app/` unless noted.
- Install: `npm install`
- Dev server: `npm run dev` (Vite, hot reload)
- Build: `npm run build` (type-check + Vite build to `dist/`)
- Preview: `npm run preview` (serve production build)
- Tests: `npm run test` (watch), `npm run test:run` (CI), `npm run test:ui` (Vitest UI)
- Lint/Format: `npm run lint` / `npm run lint:fix`, `npm run format` / `npm run format:check`
- Example: `cd ritemark-app && npm run dev`

## Coding Style & Naming Conventions
- TypeScript first; avoid `any`. Prefer explicit props and return types.
- Indentation: 2 spaces; keep lines reasonably short (~100 chars).
- React components: PascalCase files in `src/components` (e.g., `TableOfContents.tsx`).
- Functions/variables: `camelCase`; constants: `SCREAMING_SNAKE_CASE` when global.
- Utilities in `src/lib` (e.g., `utils.ts`); keep pure and tested.
- Styling uses Tailwind CSS utilities; prefer class utilities over inline styles.
- Linting via ESLint; formatting via Prettier. Pre-commit runs `lint-staged` through Husky.

## Testing Guidelines
- Framework: Vitest + Testing Library (JSDOM). Use `@testing-library/jest-dom` matchers.
- File names: `*.test.ts` or `*.test.tsx` colocated with source, or under `tests/` for broader cases.
- Write accessible tests (query by role/label, not implementation details). Keep tests deterministic.
- Run locally with `npm run test`; add `test:run` to CI steps.

## Commit & Pull Request Guidelines
- Commits: short, imperative subject (e.g., "Add editor toolbar actions"); include scope if useful.
- PRs: clear description, linked issues, steps to test, and screenshots/GIFs for UI changes.
- Keep PRs focused; update `docs/` when behavior or usage changes.

## Security & Configuration Tips
- Do not commit secrets. Use environment variables (e.g., Netlify UI) for keys.
- Special build: `npm run build:gas` targets Google Apps Script; ensure `@google/clasp` is configured if used.
