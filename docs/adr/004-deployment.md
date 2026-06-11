# ADR-004: Cloud Deployment — Azure Container Apps

## Status
Accepted

## Context
We need a deployment target that:
- Runs containerized Node.js and static frontend apps
- Scales to zero (cost-effective for dev/staging)
- Integrates with Azure Database for PostgreSQL
- Supports CI/CD via Azure Developer CLI (azd)
- Provides HTTPS and custom domains out of the box

## Decision
Deploy both backend and frontend as **Azure Container Apps**, managed by **Azure Developer CLI (azd)** with **Bicep** infrastructure-as-code.

## Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Azure App Service | Simpler setup, built-in deployment slots | No scale-to-zero, more expensive at low traffic |
| Azure Kubernetes Service (AKS) | Full Kubernetes flexibility | Over-engineered for this project size, operational overhead |
| Azure Static Web Apps + Functions | Great for static frontends | Backend would need to be Functions (architectural constraint) |

## Consequences
- **Positive**: Container Apps scales 0→N replicas based on HTTP traffic. Pay only for what you use. Bicep templates make infrastructure reproducible. `azd up` deploys everything in one command.
- **Positive**: Built-in ingress with TLS, revision management, and traffic splitting for blue-green deploys.
- **Negative**: Less control than raw Kubernetes. Cold starts when scaling from zero (~2-5s).
- **Operational**: Images are built and pushed to Azure Container Registry. Log Analytics provides centralized logging.
