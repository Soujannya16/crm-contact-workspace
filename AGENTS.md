# Repository instructions

## Repository shape and architecture

- `frontend/` is the current React + TypeScript application, bootstrapped with Vite. Its `src/App.tsx` is still the Vite starter screen; do not assume CRM screens or API integration are already implemented. Use Redux Toolkit for shared frontend state, with local component state for short-lived UI details such as form input.
- `backend/` is reserved for the planned TypeScript/Node.js + Express API backed by SQLite. It currently has no implementation. Keep persistence and CRM business rules in the backend; the React client should communicate with it over HTTP rather than access SQLite directly.
- The entity relationships, column names, and high-level flow are documented in [`docs/DESIGN.md`](docs/DESIGN.md) and illustrated in [`docs/HLD.png`](docs/HLD.png). Consult [`docs/assignment.pdf`](docs/assignment.pdf) for the source requirements.
- The design centers on Contacts, Tags, a contact-tag many-to-many junction, and per-contact Activities. The API is intended to provide contact listing (including SQL-backed search, filtering, sorting, and pagination), contact details and updates, tag changes and bulk assignment, activity history, and available tags. See `docs/DESIGN.md` for the proposed routes and payloads.
- Preserve the documented invariants when implementing the backend: email uniqueness, persistence across restarts, and optimistic concurrency using the contact `version` (a stale update returns HTTP 409). Record `CONTACT_UPDATED`, `TAG_ADDED`, and `TAG_REMOVED` activities for their corresponding successful changes. Keep database changes and their activity records consistent.
- The design uses camelCase in its conceptual/API examples and snake_case in the SQLite schema illustration. Map between API and database naming at the backend boundary; treat `docs/DESIGN.md` as the source of truth when adding or changing schema and API behavior.
- Keep the implementation straightforward and focused on an end-to-end working solution; avoid adding backend layers or complexity not required by the documented functionality. Persist data in SQLite so it survives application restarts.

## Build, test, and lint

Run frontend commands from `frontend/`:

- `npm run dev` starts the Vite development server.
- `npm run build` runs the TypeScript project build and creates the Vite production bundle.
- `npm run lint` runs ESLint.
- `npm run preview` serves the production bundle locally after a build.

There is currently no test script, test framework, or backend package configuration, so there is no single-test command yet. Do not invent test commands; when a test runner is introduced, document both its full-suite and single-test invocation here.

## Repository-specific conventions

- The frontend uses TypeScript/TSX, React, Vite, and the React Compiler (configured in `frontend/vite.config.ts`). Keep frontend changes compatible with the existing TypeScript and ESLint configuration.
- Use Redux Toolkit for shared state and keep hooks and component responsibilities clear. Keep transient form state local; make the URL the source of truth for shareable contact-list state such as search, filters, sorting, and pagination.
- Favor the configured React Compiler's automatic optimizations. Avoid blanket memoization; use `React.memo`, `useMemo`, or `useCallback` when profiling identifies costly work or stable references are needed to prevent meaningful child or effect churn. Keep Redux selectors focused, derive values instead of duplicating them in state, and render paginated results rather than the full contact collection.
- Prefer the simplest suitable UI approach for functional lists and forms. MUI or a lightweight CSS framework/library is acceptable; avoid spending effort on visual polish beyond a clean, usable, responsive interface.
- Provide clear UI feedback for loading, empty search results, invalid input, backend/update failures, and stale-data conflicts. On a conflict, do not silently overwrite the latest contact data; explain the conflict and provide a clear refresh/reload path.
- Frontend npm scripts and dependencies are defined in `frontend/package.json`; run them from that directory.
- Keep backend additions aligned with the documented HTTP contract and SQLite design. Support contact retrieval and updates, SQL-backed search/filter/sort/pagination, tag operations and bulk assignment, input validation, and appropriate error responses. Keep backend behavior simple and predictable.
- The frontend's `README.md` describes the Vite template, not additional CRM-specific behavior.
