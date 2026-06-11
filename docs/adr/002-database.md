# ADR-002: Database — Azure PostgreSQL with PostGIS

## Status
Accepted

## Context
The core feature of the app is location-based search: "find babysitters within 10km of me." We need a database that:
- Handles geospatial queries efficiently
- Works natively with Azure
- Supports relational data (users, profiles, relationships)
- Is cost-effective for a startup-scale workload

## Decision
Use **Azure Database for PostgreSQL Flexible Server** with the **PostGIS** extension enabled.

## Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Azure Cosmos DB (MongoDB API) | Flexible schema, geo queries via GeoJSON | More expensive at scale, weaker relational modeling |
| Azure SQL Database | Strong Azure integration | No native PostGIS, geospatial support via geometry types is less mature |
| MongoDB Atlas | Developer-friendly, $nearSphere queries | Not Azure-native, additional vendor management |

## Consequences
- **Positive**: PostGIS provides industry-standard geospatial functions (`ST_DWithin`, `ST_Distance`). GIST indexes make location queries fast even at scale. PostgreSQL is free, open-source, and has excellent tooling.
- **Positive**: Azure Flexible Server supports PostGIS extension, Entra ID passwordless auth, automatic backups, and scaling.
- **Negative**: Requires PostGIS extension to be explicitly enabled. Schema is rigid (need migrations).
- **Operational**: We use the Burstable B1ms tier for dev/staging, scaling to General Purpose for production.
