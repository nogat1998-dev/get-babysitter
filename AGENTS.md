# AGENTS.md — Instructions for AI Agents

This file describes how AI agents should work in the **Get Babysitter** project.

## Project Overview

A location-based babysitting platform connecting parents with nearby babysitters. Two user roles (parent, babysitter), geospatial search via PostGIS, JWT authentication, REST API + MCP server.

## Tech Stack

- **Backend**: Node.js + Express + TypeScript (`backend/`)
- **Frontend**: React + Vite + TypeScript (`frontend/`)
- **Database**: PostgreSQL 15 with PostGIS (Azure Database for PostgreSQL in production)
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **Infra**: Azure Container Apps, provisioned via Bicep (`infra/`)
- **Tooling**: azd (Azure Developer CLI)

## Setup

```bash
# Install all dependencies (root + backend + frontend)
npm run install:all

# Or individually:
cd backend && npm install
cd frontend && npm install

# Create .env from template
cp backend/.env.example backend/.env
# Edit the DATABASE_URL and JWT_SECRET values

# Run database migrations (requires running PostgreSQL)
cd backend && npm run db:migrate
```

## Running Locally

```bash
# Start both backend and frontend concurrently
npm run dev

# Or separately:
cd backend && npm run dev    # REST API on :3001, MCP on :3002
cd frontend && npm run dev   # Vite dev server on :5173
```

The frontend proxies `/api/*` requests to the backend (configured in `vite.config.ts`).

## Building

```bash
npm run build              # Builds both
cd backend && npm run build   # TypeScript → dist/
cd frontend && npm run build  # Vite → dist/
```

## Testing

```bash
cd backend && npx tsc --noEmit   # Type checking (no test framework yet)
cd frontend && npx tsc --noEmit  # Type checking
```

## Project Structure

```
get-babysitter/
├── backend/src/
│   ├── index.ts          # Express app entry + MCP server startup
│   ├── config/env.ts     # Environment variables
│   ├── db/pool.ts        # PostgreSQL connection pool
│   ├── db/migrate.ts     # Database schema migrations
│   ├── middleware/auth.ts # JWT authentication middleware
│   ├── mcp/server.ts     # MCP server (JSON-RPC, port 3002)
│   └── routes/
│       ├── auth.ts       # POST /api/auth/register, /api/auth/login
│       ├── profile.ts    # GET/PATCH /api/profile
│       └── babysitters.ts # GET /api/babysitters/nearby, /:id
├── frontend/src/
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # Router setup
│   ├── pages/            # Page components (Home, Login, Register, Dashboard)
│   └── services/api.ts   # API client helper
├── infra/                # Azure Bicep IaC
│   ├── main.bicep        # Root template
│   └── modules/          # PostgreSQL, Container Apps, Container Env
├── docs/adr/             # Architecture Decision Records
├── azure.yaml            # Azure Developer CLI configuration
└── package.json          # Root workspace scripts
```

## Key Conventions

1. **API routes** are prefixed with `/api/`. All return JSON.
2. **Authentication** uses Bearer JWT tokens in the `Authorization` header.
3. **Database queries** use parameterized queries via `pg` pool (never raw string interpolation).
4. **Geospatial** data uses `GEOGRAPHY(POINT, 4326)` type. Always pass coordinates as `(longitude, latitude)` to PostGIS functions.
5. **Validation** is done with Zod schemas at the route handler level.
6. **Environment config** is centralized in `backend/src/config/env.ts`.
7. **MCP tools** are defined in `backend/src/mcp/server.ts` — add new tools to the `tools` array and `handleToolCall` switch.

## Deployment

```bash
azd auth login
azd up    # Provisions infrastructure + deploys containers
```

## Things to Know Before Making Changes

- The PostGIS extension must be enabled in the database (`CREATE EXTENSION IF NOT EXISTS postgis`).
- JWT tokens embed the user role — changes to the role system require re-issuing tokens.
- The MCP server shares the same database pool as the REST API (same process).
- Frontend uses Vite's proxy in dev — in production, nginx handles routing.
- Bicep templates use `uniqueString()` for resource naming — don't hardcode resource names.
