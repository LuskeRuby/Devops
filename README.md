# Family Planner

A family calendar and chore planner: parents plan tasks and award points, children see their tasks and
rewards, and the family can chat. Angular SPA/PWA, Spring Boot API, PostgreSQL.

Built in the DTU full stack course and continued in **62582 Complex Systems and DevOps** (autumn 2026).
The DevOps backlog (what is missing and why) is in [`docs/devops-backlog.md`](docs/devops-backlog.md).

## Architecture

Production (`docker-compose.prod.yml`). In development, `ng serve` takes the place of nginx.

```text
browser ──HTTPS──> nginx (frontend container)
                    ├── /            Angular SPA (static files, index.html fallback)
                    ├── /api/        ──> backend:8080  Spring Boot REST API
                    └── /websocket   ──> backend:8080  STOMP over WebSocket (chat)
                                              │
                                              └──> postgres:5432  PostgreSQL 17
```

| Part | Tech | Folder |
|---|---|---|
| Frontend | Angular 21 (standalone components), Angular Material, angular-calendar, STOMP client, service worker (production builds only) | `frontend/` |
| Backend | Spring Boot 3.5, Java 25, Maven wrapper, Spring Security (stateless JWT + refresh-token cookie), Spring Data JPA, STOMP broker on `/topic` | `backend/` |
| Database | PostgreSQL 17 | container `postgres` |
| E2E tests | Playwright | `tests/`, `playwright.config.ts` |
| CI/CD | GitHub Actions | `.github/workflows/ci-cd.yml` |

### Code layout

```text
backend/src/main/java/backend/
├── family/      family account: register, login, refresh
├── user/        family members (parent/child), PIN, points
├── task/        tasks and calendar events
├── message/     chat messages (REST + WebSocket)
├── image/       image upload and download
└── common/
    ├── config/      Spring Security, CORS, WebSocket
    ├── security/    JWT filter/util, WebSocket auth, refresh tokens
    └── exception/   global exception handler
backend/src/test/java/backend/   unit tests (*Test) and Testcontainers integration tests (*IT)

frontend/src/app/
├── auth/        AuthService, HTTP interceptor, route guard
├── components/  pages and UI components
├── features/    task feature
└── services/    HTTP services, WebSocket service, signal-based PointsStore
```

## Prerequisites

- Git
- Docker Desktop (Windows/macOS) or Docker Engine with the Compose plugin (Linux)
- Only for running or testing outside Docker: JDK 25 and Node.js 22 or 24

Commands below are shown for bash (Linux, macOS, Git Bash). Where Windows differs, the PowerShell version
is given too.

## Run locally (Docker, recommended)

```bash
git clone https://github.com/LuskeRuby/Devops.git
cd Devops
docker compose up
```

Compose loads `docker-compose.yml` and `docker-compose.override.yml` (dev) automatically. The project name
is fixed to `family-planner`, whatever the folder is called.

| Service | URL | Notes |
|---|---|---|
| frontend | http://localhost:4200 | `ng serve` with live reload; proxies `/api` and `/websocket` to the backend |
| backend | http://localhost:8080 | `mvn spring-boot:run` on the mounted source |
| postgres | localhost:5432 | database `familyapp`, user `admin`, password `postgres` (dev only) |

The first start takes a few minutes (Maven and npm downloads). The app is ready when the backend logs
`Started BackendApplication`. Create an account at http://localhost:4200/register to log in.

Stop with `Ctrl+C`, or `docker compose down`. Add `-v` to also delete the database volume.

### Seed data (optional)

Start the stack first and wait for the backend: Hibernate creates the tables on startup.

```bash
./seed.sh
```

```powershell
.\seed.bat
```

The schema uses `ddl-auto=create-drop`, so the data is gone after every backend restart; seed again.
The seeded families have no known passwords, so they are for looking at data, not for logging in.

## Run parts on the host (without the app containers)

Start only the database, then run the backend and/or frontend on your machine.

```bash
docker compose up postgres
```

Backend (needs JDK 25). `application.properties` points at the compose host name `postgres`, so override
the URL and password:

```bash
cd backend
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/familyapp \
SPRING_DATASOURCE_PASSWORD=postgres \
./mvnw spring-boot:run
```

```powershell
cd backend
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/familyapp"
$env:SPRING_DATASOURCE_PASSWORD = "postgres"
.\mvnw.cmd spring-boot:run
```

Frontend (needs Node 22 or 24):

```bash
cd frontend
npm ci
npm start
```

`frontend/proxy.conf.mjs` sends `/api` and `/websocket` to `http://localhost:8080` by default. Set
`BACKEND_URL` to use another backend (compose sets it to `http://backend:8080`).

## Tests

Backend (Docker must be running: the tests use Testcontainers PostgreSQL):

```bash
cd backend
./mvnw verify      # unit tests + integration tests; Windows: .\mvnw.cmd verify
```

Frontend (the same steps as CI):

```bash
cd frontend
npm ci
npx ng lint
npx prettier --check "src/**/*.{ts,html,scss}"   # fix with --write
npx ng test --no-watch
npm run build
```

End-to-end (Playwright). Start the dev stack first (`docker compose up`); Playwright reuses the servers on
ports 8080 and 4200 and registers its own test family through the API.

```bash
npm ci
npx playwright install     # first time only: downloads the browsers
npx playwright test
```

## CI/CD and deployment

`.github/workflows/ci-cd.yml` runs on every pull request and push to `main`:

1. **backend-build**: JDK 25, `./mvnw verify`.
2. **frontend-build**: `npm ci`, lint, Prettier check, unit tests, production build.
3. **deploy** (push to `main` only, after both builds pass): SSH to the VM, `git reset --hard origin/main`,
   write the TLS certificate from secrets, then rebuild and restart the production stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

**Merging to `main` deploys to production.** Work on a branch (`feature/…`, `fix/…`) and open a PR.

The production stack (`docker-compose.prod.yml`) builds `backend/Dockerfile` and `frontend/Dockerfile`
(multi-stage builds). nginx serves the SPA on ports 80/443, redirects HTTP to HTTPS, terminates TLS with
the certificate in `./certs` (not in git), and proxies `/api/` and `/websocket` to the backend.

Repository secrets used by the deploy job: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSL_CERTIFICATE`,
`SSL_PRIVATE_KEY`, `PROD_DB_USER`, `PROD_DB_PASSWORD`.

Known gaps in the pipeline and the deployment (the VM path still comes from the full stack course, no image
registry, no health checks, and more) are tracked in [`docs/devops-backlog.md`](docs/devops-backlog.md).

## Line endings

`.gitattributes` makes every text file LF on all platforms (`.bat`/`.cmd` stay CRLF), so Linux tools,
Docker bind mounts and Prettier agree with Windows. A fresh clone needs nothing. A clone made before this
change still has CRLF files on Windows; to refresh it, commit or stash your work and then run:

```bash
git rm -r --cached -q .
git reset --hard
```
