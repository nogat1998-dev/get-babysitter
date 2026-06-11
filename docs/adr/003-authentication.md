# ADR-003: Authentication — JWT with bcrypt

## Status
Accepted

## Context
The app has two user roles (parent, babysitter) and needs:
- Secure registration and login
- Stateless authentication (for horizontal scaling)
- Role-based access control
- Token expiration and refresh capability

## Decision
Use **JSON Web Tokens (JWT)** for stateless authentication with **bcrypt** for password hashing. Tokens encode user ID, email, and role.

## Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Session-based auth (express-session + Redis) | Simple, revocable | Requires session store, harder to scale stateless |
| Azure Entra ID (OAuth 2.0) | Enterprise SSO, managed service | Complex setup for consumer app, overkill for MVP |
| Passport.js + OAuth providers | Social login support | Extra complexity, dependency on third-party providers |

## Consequences
- **Positive**: JWTs are stateless — no session store needed. Each Container App replica can verify tokens independently. Role is embedded in the token for fast authorization checks.
- **Negative**: Tokens cannot be revoked until they expire (mitigated with short expiration + refresh tokens in future). JWT secret must be securely managed (stored in Azure Key Vault in production).
- **Security**: Passwords are hashed with bcrypt (cost factor 12). Tokens expire after 7 days. HTTPS enforced in production.
