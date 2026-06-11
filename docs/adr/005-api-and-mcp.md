# ADR-005: Public API and MCP Server

## Status
Accepted

## Context
The lab requirements specify the project must include "a public API and/or an MCP server." We want:
- A standard REST API for the web frontend and third-party integrations
- An MCP (Model Context Protocol) server so AI agents can search for babysitters programmatically

## Decision
Provide **both**:
1. A **REST API** (Express, under `/api/*`) for the frontend and external consumers.
2. An **MCP server** (JSON-RPC over HTTP on port 3002) that exposes babysitter search tools to AI agents.

## Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| REST API only | Simpler, well-understood | No native AI agent integration |
| GraphQL | Flexible queries, single endpoint | Overhead for this use case, steeper learning curve |
| MCP only | Cutting-edge AI integration | Not usable by regular web clients |

## Consequences
- **Positive**: REST API serves the frontend and any standard HTTP clients. MCP server enables AI assistants (GitHub Copilot, Claude, etc.) to directly search for babysitters using natural language.
- **Positive**: MCP tools are self-describing — AI agents can discover capabilities via `tools/list`.
- **Negative**: Two interfaces to maintain. MCP protocol is newer with a smaller ecosystem.
- **Future**: Could add SSE transport for MCP to support streaming, and add more tools (booking, reviews).
