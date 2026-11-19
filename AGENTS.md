# Repository instructions

## Repository shape and architecture

- `frontend/` is the current React + TypeScript application, bootstrapped with Vite. Its `src/App.tsx` is still the Vite starter screen; do not assume CRM screens or API integration are already implemented.
- `backend/` is reserved for the planned TypeScript/Node.js + Express API. It currently has no implementation. Keep persistence and CRM business rules in the backend; the React client should communicate with it over HTTP rather than access SQLite directly.
- SQLite is the planned persistent store. The entity relationships, column names, and high-level flow are documented in [`docs/DESIGN.md`](docs/DESIGN.md) and illustrated in [`docs/HLD.png`](docs/HLD.png). Consult [`docs/assignment.pdf`](docs/assignment.pdf) for the source requirements.
- The design centers on Contacts, Tags, a contact-tag many-to-many junction, and per-contact Activities. The API is intended to provide contact listing (including SQL-backed search, filtering, sorting, and pagination), contact details and updates, tag changes and bulk assignment, activity history, and available tags. See `docs/DESIGN.md` for the proposed routes and payloads.
- Preserve the documented invariants when implementing the backend: email uniqueness, persistence across restarts, and optimistic concurrency using the contact `version` (a stale update returns HTTP 409). Record `CONTACT_UPDATED`, `TAG_ADDED`, and `TAG_REMOVED` activities for their corresponding successful changes. Keep database changes and their activity records consistent.
- The design uses camelCase in its conceptual/API examples and snake_case in the SQLite schema illustration. Map between API and database naming at the backend boundary; treat `docs/DESIGN.md` as the source of truth when adding or changing schema and API behavior.

## Build, test, and lint

Run frontend commands from `frontend/`:

- `npm run dev` starts the Vite development server.
- `npm run build` runs the TypeScript project build and creates the Vite production bundle.
- `npm run lint` runs ESLint.
- `npm run preview` serves the production bundle locally after a build.

There is currently no test script, test framework, or backend package configuration, so there is no single-test command yet. Do not invent test commands; when a test runner is introduced, document both its full-suite and single-test invocation here.

## Repository-specific conventions

- The frontend uses TypeScript/TSX, React, Vite, and the React Compiler (configured in `frontend/vite.config.ts`). Keep frontend changes compatible with the existing TypeScript and ESLint configuration.
- Frontend npm scripts and dependencies are defined in `frontend/package.json`; run them from that directory.
- Keep backend additions aligned with the documented HTTP contract and SQLite design. Perform search, filtering, ordering, and pagination in SQL as specified by the design rather than loading the full contact list into the UI.
- The frontend's `README.md` describes the Vite template, not additional CRM-specific behavior.
