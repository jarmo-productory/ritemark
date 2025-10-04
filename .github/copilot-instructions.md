# Copilot Instructions for AI Coding Agents

## Project Overview
- **RiteMark** is a Vite + React + TypeScript app (`ritemark-app/`) with a focus on WYSIWYG Markdown editing for AI-native, non-technical users.
- The codebase includes agent/orchestration configs (`.claude`, `.swarm`, `.hive-mind/`), documentation (`docs/`), scripts (`scripts/`), and memory/session management (`memory/`).

## Architecture & Structure
- **Frontend:** All app features live in `ritemark-app/`, with key folders:
  - `src/components`: React components (PascalCase)
  - `src/lib`: Pure utilities, tested
  - `src/assets`: Static files
- **Testing:** Unit tests in `src/*.test.tsx`, broader/integration tests in `tests/`.
- **Agents:** Do NOT modify `.claude`, `.swarm`, `.hive-mind/` for app features; these are reserved for orchestration/config.

## Developer Workflows
- **Install dependencies:** `npm install` (run from `ritemark-app/`)
- **Start dev server:** `npm run dev`
- **Build:** `npm run build` (includes type-check)
- **Preview production build:** `npm run preview`
- **Run tests:** `npm run test` (watch), `npm run test:run` (CI), `npm run test:ui` (Vitest UI)
- **Lint/Format:** `npm run lint`, `npm run lint:fix`, `npm run format`, `npm run format:check`
- **Special build:** `npm run build:gas` for Google Apps Script (requires `@google/clasp`)

## Coding Conventions
- **TypeScript-first:** Avoid `any`; use explicit types for props/returns.
- **Naming:**
  - Components: PascalCase
  - Functions/variables: camelCase
  - Global constants: SCREAMING_SNAKE_CASE
- **Styling:** Use Tailwind CSS utility classes; avoid inline styles.
- **Linting/Formatting:** ESLint + Prettier; pre-commit hooks via Husky.

## Testing Patterns
- Use Vitest + Testing Library (`@testing-library/jest-dom`)
- Prefer accessible queries (by role/label)
- Keep tests deterministic and colocated with source when possible

## Agent-Specific Protocols
- **ALWAYS check existing code and directory structure before creating or editing files.**
  - Use existing folders; do not create new top-level directories unless necessary.
  - Example: Use `docs/research` if it exists, do not create `research/`.
- **Before starting work:**
  1. Read current codebase and sprint files
  2. Test/run existing functionality
  3. Report if work is already complete
- **Directory management:**
  - Search for existing folders before creating new ones
  - Follow established patterns for file organization

## Commit & PR Guidelines
- Use short, imperative commit messages (e.g., "Add editor toolbar actions")
- PRs should include clear descriptions, linked issues, and UI screenshots/GIFs for visual changes
- Update documentation (`docs/`) when behavior or usage changes

## Security & Configuration
- Never commit secrets; use environment variables for keys
- Netlify UI is used for environment management

## Key References
- See `AGENTS.md` for agent protocols and coding lifecycle
- See `CLAUDE.md` for AI-assisted engineering process and SPARC methodology
- See `ritemark-app/README.md` for frontend setup and linting details

---

_If any section is unclear or missing project-specific patterns, please provide feedback to improve these instructions._
