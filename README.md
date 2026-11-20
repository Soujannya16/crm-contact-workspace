## How to Run the Frontend and Backend

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Soujannya16/crm-contact-workspace.git
cd crm-contact-workspace

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 2. Seed the Database

The database seeds automatically on server startup if empty, or you can run the standalone seed script:

```bash
cd backend
npm run seed
```
This populates 15 diverse contacts across tech companies (Google, Apple, Microsoft, Amazon, Meta, Stripe, Netflix) with varied tags, phones, and initial activity logs.

### 3. Run the Development Servers

Open two terminal tabs:

**Terminal 1 — Backend API Server:**
```bash
cd backend
npm run dev
# Starts Express server on http://localhost:5000 (with tsx hot-reload)
```

**Terminal 2 — Frontend Application:**
```bash
cd frontend
npm run dev
# Starts Vite client on http://localhost:5173 (proxies /api to http://localhost:5000)
```

Open your browser and navigate to: **`http://localhost:5173`**

### 4. Build for Production

```bash
# Compile backend TypeScript to dist/
cd backend
npm run build
npm start

# Compile frontend bundle
cd ../frontend
npm run build
npm run preview
```

## Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) with TypeScript
- **Build Tool & Bundler**: [Vite 8](https://vitejs.dev/) with Babel plugin for [React Compiler](https://react.dev/learn/react-compiler)
- **State Management**: [Redux Toolkit (RTK)](https://redux-toolkit.js.org/) for server-state caching and async thunks
- **Routing**: [React Router v7](https://reactrouter.com/) (URL search params as single source of truth for list state)
- **Styling & Typography**: Custom Design System with CSS variables, [Epilogue](https://fonts.google.com/specimen/Epilogue) (display/headings) & [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (body/data/meta)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linting**: ESLint 10 with `typescript-eslint`

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules / TypeScript)
- **Framework**: [Express 4](https://expressjs.com/) with CORS middleware
- **Database Engine**: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (synchronous SQLite binding with WAL mode)
- **Validation**: [Zod](https://zod.dev/) for strict runtime request body parsing
- **Development Tooling**: `tsx` (fast TypeScript execution with file watching)
- **Testing**: [Vitest](https://vitest.dev/) with [Supertest](https://github.com/ladjs/supertest)

### Infrastructure & Deployment
- **Platform**: [Render](https://render.com/) via [`render.yaml`](render.yaml) Infrastructure-as-Code
- **Backend Service**: Node Web Service (`crm-contact-backend`)
- **Frontend Service**: Static Site (`crm-contact-frontend`) with `VITE_API_URL` environment configuration

## Important Technical Decisions

- **Consolidated Query Engine (`GET /contacts`)**: Search across name/email/phone, multi-attribute filtering (company, tag), sorting, and pagination are handled entirely by a single parameterized SQL query on the backend.
- **Optimistic Concurrency Control (OCC)**: Managed via an integer `version` column. Collisions return HTTP `409 Conflict` (`stale_update`) without holding database locks.
- **Atomic Transactions**: Contact updates, tag associations, and audit activity entries (`CONTACT_UPDATED`, `TAG_ADDED`, `TAG_REMOVED`) execute inside atomic SQLite transactions (`better-sqlite3`).
- **URL as Single Source of Truth**: Search, filters, sort direction, and pagination state are synced directly with URL query parameters for shareability, bookmarking, and native browser history navigation.
- **Environment-Aware API Layer**: The frontend API client automatically uses the local Vite proxy (`/api`) in development and points to `VITE_API_URL` when deployed to Render.

*For complete architectural rationales, see [`docs/ARCHITECTURE.md#key-technical-decisions`](docs/ARCHITECTURE.md#key-technical-decisions).*


## Data Model

The persistence layer uses SQLite (WAL mode) with four relational entities:
- **`contacts`**: Core contact entity (first/last name, unique email, phone, company, timestamps, and `version` counter).
- **`tags`**: Unique tag labels (VIP, Customer, Lead, Partner, Prospect).
- **`contact_tags`**: Many-to-many junction table with cascade deletion.
- **`activities`**: Append-only audit trail logging `CONTACT_UPDATED`, `TAG_ADDED`, and `TAG_REMOVED` with contact ID and UTC timestamp.

*Complete ER diagrams and SQL DDL are available in [`docs/ARCHITECTURE.md#data-model--database-schema`](docs/ARCHITECTURE.md#data-model--database-schema) and [`docs/DESIGN.md`](docs/DESIGN.md).*


## Concurrent Update Approach

To prevent accidental overwrites when two users edit the same contact concurrently:
1. Each contact maintains a `version` number incremented on every update.
2. Updates execute `UPDATE contacts SET ... version = version + 1 WHERE id = ? AND version = ?`.
3. If another user committed an update in the interim, the version check fails (0 rows affected), rolling back the transaction and returning HTTP 409 (`stale_update`).
4. The frontend catches 409 and displays a non-destructive conflict banner with a 1-click **Reload Latest Version** button.

*Flow diagram and code references are available in [`docs/ARCHITECTURE.md#concurrent-update-approach`](docs/ARCHITECTURE.md#concurrent-update-approach).*


## Known Issues / Incomplete Functionality

- **Bulk Selection Scope**: Bulk tag assignment currently applies to contacts selected on the active page view rather than across all paginated pages.
- **Contact Creation / Deletion**: In line with the assignment's focus on browsing, searching, filtering, updating, and tag/activity management, create and delete endpoints were not required and are not implemented.
- **SQLite Single-Writer Concurrency**: SQLite WAL mode supports concurrent readers but serializes writes; high-volume multi-node cloud deployments would migrate to PostgreSQL.


## AI Usage Disclosure

- **Methodology & Tools**: Employed **spec-driven development** using **Anthropic** (Claude) and **Google Antigravity** to scaffold features against formal specifications.
- **UI Generation**: Used **Stitch AI** to build UI components styled to match the [Figma Design Canvas](https://www.figma.com/design/kJYSNQHgiUYXhsDm1kAQqP/Untitled?node-id=0-1&t=XuP461syWwUPd8vG-1).
- **One AI Suggestion Changed / Rejected**: An initial AI proposal recommended client-side filtering in Redux memory. This was rejected in favor of SQL-backed backend querying to satisfy the requirement for handling millions of contacts.


## Detailed Documentation Links

- **Technical Implementation & Architecture**: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Functional Requirements & API Design**: [`docs/DESIGN.md`](docs/DESIGN.md)
- **Production Scale Considerations**: [`docs/ARCHITECTURE.md#scale-considerations`](docs/ARCHITECTURE.md#scale-considerations)
- **UI Design System Spec**: [`DESIGN.md`](DESIGN.md)
- **Requirements & Audit Checklist**: [`docs/checklist.md`](docs/checklist.md)
