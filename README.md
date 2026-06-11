# Get Babysitter 🍼

A location-based platform connecting parents with trusted babysitters nearby.

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TypeScript
- **Database**: Azure Database for PostgreSQL (with PostGIS for geospatial queries)
- **Auth**: JWT + bcrypt
- **Cloud**: Azure Container Apps (via azd + Bicep)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ with PostGIS extension (or Azure Database for PostgreSQL)
- Azure Developer CLI (`azd`) for deployment

### Local Development

```bash
# Install all dependencies
npm run install:all

# Copy environment file
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# Run database migrations
cd backend && npm run db:migrate && cd ..

# Start dev servers (backend + frontend concurrently)
npm run dev
```

Backend runs on http://localhost:3001  
Frontend runs on http://localhost:5173

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (parent or babysitter) |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/profile` | Get current user's profile |
| PATCH | `/api/profile` | Update profile (including location) |
| GET | `/api/babysitters/nearby?lat=X&lng=Y&radius=10` | Find babysitters near location |
| GET | `/api/babysitters/:id` | Get babysitter details |
| GET | `/api/health` | Health check |

### Deploy to Azure

```bash
azd auth login
azd up
```

This provisions:
- Azure Database for PostgreSQL Flexible Server (with PostGIS)
- Azure Container Apps (backend + frontend)
- Log Analytics workspace

## Project Structure

```
get-babysitter/
├── backend/            # Express API server
│   ├── src/
│   │   ├── config/     # Environment config
│   │   ├── db/         # Database pool & migrations
│   │   ├── middleware/ # Auth middleware
│   │   └── routes/     # API routes
│   └── Dockerfile
├── frontend/           # React SPA
│   ├── src/
│   │   ├── pages/      # Page components
│   │   └── services/   # API client
│   └── Dockerfile
├── infra/              # Azure Bicep templates
│   ├── main.bicep
│   └── modules/
├── azure.yaml          # Azure Developer CLI config
└── package.json        # Root workspace scripts
```
