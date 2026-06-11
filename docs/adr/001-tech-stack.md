# ADR-001: Tech Stack Selection

## Status
Accepted

## Context
We are building a location-based babysitting platform ("Get Babysitter") that connects parents with nearby babysitters. The platform needs:
- Two user roles (parent, babysitter) with distinct profiles
- Geospatial search (find babysitters within X km)
- Authentication and authorization
- A responsive web frontend
- Cloud deployment on Azure

## Decision
We chose the following stack:
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TypeScript
- **Database**: Azure Database for PostgreSQL Flexible Server (with PostGIS)
- **Language**: TypeScript end-to-end

## Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Python + FastAPI | Great for ML, good async | Two languages to maintain, weaker frontend sharing |
| C# + .NET | Strong Azure integration | Heavier boilerplate, less frontend dev tooling |
| Next.js (fullstack) | Single framework | Less separation of concerns, harder to deploy API independently |

## Consequences
- **Positive**: TypeScript across the full stack enables shared types and easier refactoring. Express is battle-tested for REST APIs. React+Vite gives fast dev iteration.
- **Negative**: Node.js is single-threaded (mitigated by Azure Container Apps scaling). Express requires more manual setup than opinionated frameworks.
- **Risks**: Team must be comfortable with TypeScript.
