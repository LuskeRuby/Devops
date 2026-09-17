# CLAUDE.md — Family Planner · DTU 62582 Complex Systems and DevOps

Read this file before doing anything in this repo. It says what the project is, what the course expects, how the code is built and deployed, and how Ruby wants you to work.

## 1. What this is

The family planner web app (Angular + Spring Boot + PostgreSQL) was built as a group project in the DTU full stack course. In **62582 Complex Systems and DevOps (autumn 2026)** the group keeps working on the same app. The goal is to make the project meet the course learning objectives, with most of the new work on the DevOps side: CI/CD, containers, package management, security, state management and operations.

- Repo: `https://github.com/LuskeRuby/Devops` (branch `main`). It is a copy of the original full stack repo (`MiniBossDK/...`), so the git history and PR numbers before `#1` come from that repo.
- Local checkout: `C:\Users\rubym\IdeaProjects\Devops` (Windows, IntelliJ).
- The CI workflow is named "Family Planner CI/CD" (renamed in K2).

## 2. Course facts (62582)

- 5 ECTS, taught in English (the slides are in Danish). Thursdays 13–17, Campus Ballerup, 13 weeks.
- Lectures and lab work. Group work: "develop a web site locally". The course uses selected papers.
- Exam: **oral exam + exercises**, 7-point scale, external examiner. Responsible teacher: Henrik Tange; co-responsible: Maria Papaioannou.
- Prerequisites: version control and test methods (02315/62532), backend in Java (or C#), JavaScript.

### Learning objectives (LO)
A student who meets the objectives can:
1. Apply selected frameworks for frontend and backend development.
2. Explain and implement "application state" using a state manager.
3. Set up basic backend security and token-based security.
4. Apply frameworks for developing complex systems.
5. Apply package managers.
6. Set up continuous integration, test and delivery (CI/CD).
7. Containerize, and set up build servers, PaaS and IaaS.
8. Understand DevOps and work effectively in a DevOps organisation.

### Lecture plan, and what the repo already covers

| # | Topic | LO | Already in the repo | Likely work |
|---|---|---|---|---|
| 1 | Introduction, group formation | – | – | Repo moved to LuskeRuby/Devops, this file |
| 2 | SPA (single page applications) | 1 | Angular 21 standalone SPA, router, nginx SPA fallback | – |
| 3 | PWA as an alternative to mobile apps | 1 | `ngsw-config.json`, `manifest.webmanifest`, `provideServiceWorker` (production only) | Check install and offline behaviour over HTTPS, and how updates reach users |
| 4 | Frameworks for frontend and backend | 1, 4 | Angular + Material, Spring Boot 3.5 | – |
| 5 | Introduction to DevOps | 8 | PR-based GitHub flow, CI on PRs | Describe and justify the team workflow |
| 6 | Application state with a state manager | 2 | Signals-based `PointsStore`; `BehaviorSubject` state in `AuthService` and other services | Decide between a real state manager (NgRx Store/SignalStore) and arguing that the signal store is enough |
| 7 | Package managers | 5 | npm (lockfiles, `packageManager: npm@11.8.0`), Maven + wrapper | Versioning, dependency updates/audit, clean up the stray root `package.json` |
| 8 | CI/CD, web-based CI and delivery | 6 | `.github/workflows/ci-cd.yml`: build/lint/test, then SSH deploy | See the gaps in section 7 |
| 9 | Security in web-based systems | 3 | CORS config, HTTPS termination in nginx | Secrets handling, security headers |
| 10 | Backend security and token-based security | 3 | BCrypt, JWT access token + refresh-token cookie, WebSocket auth interceptor | Move the JWT secret out of source control, review where tokens are stored |
| 11 | Containerization, build servers, PaaS and IaaS | 7 | Multi-stage Dockerfiles, dev/prod compose files, deploy to a VM (IaaS) | Image registry, health checks, a PaaS comparison |
| 12 | Real-time web apps with publish-subscribe | (optional) | STOMP over WebSocket, simple broker on `/topic` (chat) | – |
| 13 | Wrap-up | all | – | Exam prep |

Update the "Already in the repo" column when work lands.

### Lecture 1: key points (CI/CD)
Source paper: *Implementing continuous integration and continuous deployment (CI/CD) pipelines*, https://doi.org/10.30574/ijsra.2021.3.2.0073
- Pipeline stages: **source** (Git), **build** (compile, package, container), **test** (unit and integration), **deploy** (staging/production).
- CI means integrating often into a shared repo, running automated builds and tests on every integration, checking code quality with static analysis, and giving developers fast feedback.
- The paper uses CD for two things. Continuous **delivery** keeps the code always releasable and pushes it to staging/production automatically. Continuous **deployment** sends every change that passes the tests to production with no manual step.
- Benefits: faster delivery, better code quality, lower deployment risk (easier rollback), better collaboration, scalability (staging, pre-prod and prod pipelines).
- Tools: Git; Jenkins, Travis CI, CircleCI, GitLab CI, GitHub Actions, Maven/Gradle; Docker, Kubernetes, Ansible, Terraform; Prometheus, Grafana.
- Best practice: start small, automate testing, use feature flags, get fast feedback, keep the codebase clean.
- Challenges: resistance to change, tool complexity, infrastructure load, **security (store secrets safely, check dependencies for vulnerabilities)**.

## 3. Stack

**Backend** (`backend/`): Spring Boot 3.5.11, Java 25, Maven (wrapper included), Lombok.
- Organised by feature under `backend/src/main/java/backend/`: `family/`, `user/`, `task/`, `message/`, `image/`, plus `common/` (`config/`, `security/`, `exception/`).
- PostgreSQL 17 through Spring Data JPA. H2 is also on the runtime classpath.
- Security: Spring Security with a stateless JWT filter (`JwtFilter`, `JwtUtil`, jjwt 0.13). The access token expires after 60 s. Refresh tokens are stored in the database (`common/security/refreshtoken`) and sent as a cookie. Passwords are hashed with BCrypt. Family members also have a PIN.
- Public endpoints: `/api/families/{register,login,refresh}`, `/websocket/**`, `/api/images/**`.
- WebSocket: STOMP endpoint `/websocket`, simple broker `/topic`, app prefix `/app`, with `WebSocketAuthInterceptor` on the inbound channel.
- Tests: JUnit 5 + Mockito (`*Test`), plus integration tests (`*IT`, run by failsafe) using Testcontainers PostgreSQL with `@ServiceConnection`. The base class is `support/AbstractIntegrationTest`. JaCoCo generates a report but no coverage gate enforces it.

**Frontend** (`frontend/`): Angular 21 (standalone components), Angular Material, angular-calendar (date-fns), `@stomp/stompjs`, lucide/phosphor icons. The locale is `da`.
- Auth: `auth/auth.service.ts`, `auth.interceptor.ts`, `auth.guard.ts`. The access token is kept in `localStorage` ("remember me") or `sessionStorage`.
- State: `services/points-store.service.ts` (signals + computed). Other services use RxJS subjects.
- PWA: the service worker is enabled only in production builds.
- Tooling: ESLint (angular-eslint) and Prettier (`printWidth` 100, `singleQuote`). Unit tests use Vitest + jsdom through `@angular/build:unit-test`.
- Code lives mostly in `src/app/components/`, `src/app/services/` and `src/app/features/task/`. `README.md` describes the real layout and how to run, test and deploy (rewritten in K2).

**E2E** (repo root): Playwright (`playwright.config.ts`, `tests/`), with projects "Desktop Chrome" (parent view) and "iPhone 13" (child view). `global-setup.ts` registers the family `e2e@playwright.test` and a parent with PIN `0000` through the API on `:8080`.

## 4. Commands

Run these from the repo root unless a folder is given. On Windows, use `mvnw.cmd` instead of `./mvnw`.

```bash
# Full dev stack: postgres:5432, backend:8080 (mvn spring-boot:run), frontend:4200 (ng serve with proxy)
docker compose up            # docker-compose.yml + docker-compose.override.yml load automatically

# Backend
cd backend && ./mvnw verify          # unit + integration tests (needs Docker for Testcontainers)
cd backend && ./mvnw test            # surefire only (still needs Docker: BackendApplicationTests uses Testcontainers)

# Frontend: same steps as CI
cd frontend && npm ci
npx ng lint
npx prettier --check "src/**/*.{ts,html,scss}"    # fix with: npx prettier --write "src/**/*.{ts,html,scss}"
npx ng test --no-watch
npm run build                                       # defaultConfiguration = production

# E2E (root). Starts or reuses the backend on :8080 and ng serve on :4200
npm ci && npx playwright test

# Seed data: start the stack and wait for the backend first; re-seed after every backend restart (create-drop)
./seed.sh        # or seed.bat (uses `docker compose exec -T postgres`)
```

`frontend/proxy.conf.mjs` proxies `/api` and `/websocket` to `BACKEND_URL` (compose sets `http://backend:8080`) and defaults to `http://localhost:8080` for `ng serve` on the host. A backend run on the host needs `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/familyapp` and `SPRING_DATASOURCE_PASSWORD=postgres`, because `application.properties` points at the compose host `postgres`.

## 5. Environments and deployment

- **Compose layering:** `docker-compose.yml` is the base (postgres + dependencies). `docker-compose.override.yml` is for dev: source mounted, Maven/Node images, ports 5432/8080/4200, dev credentials `admin`/`postgres`. `docker-compose.prod.yml` builds both Dockerfiles, sets `restart: always`, reads DB credentials from env, and runs nginx on 80/443 with `./certs` mounted. The project name is fixed to `family-planner` (`name:` in `docker-compose.yml`), so container and volume names don't depend on the folder name.
- **Images:** `backend/Dockerfile` builds with Maven (dependencies cached in their own layer, tests skipped) and runs on `eclipse-temurin:25-jre`. `frontend/Dockerfile` builds with `node:24-alpine` and serves with `nginx:alpine`.
- **nginx** (`frontend/nginx.conf`): redirects HTTP to HTTPS, terminates TLS, falls back to `index.html` for SPA routes, and proxies `/api/` and `/websocket` (with upgrade) to `backend:8080`. `server_name` is `130.225.170.60`.
- **CI/CD** (`.github/workflows/ci-cd.yml`) runs on push/PR to `main`:
  1. `backend-build`: JDK 25 Temurin, `./mvnw verify`.
  2. `frontend-build`: Node 22, `npm ci`, lint, Prettier check, tests, build.
  3. `deploy` (only on push to `main`, after both builds pass): SSHes into the VM, runs `cd ~/full-stack-app && git reset --hard origin/main`, writes the certs from secrets, runs a one-time `docker compose -p full-stack-app ... down` to stop the stack from before the project rename (remove after the first deploy), then runs `docker compose -f docker-compose.yml -f docker-compose.prod.yml down` and `up -d --build`.
  - Secrets: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSL_CERTIFICATE`, `SSL_PRIVATE_KEY`, `PROD_DB_USER`, `PROD_DB_PASSWORD`.

## 6. Test-writing patterns (learned the hard way in the full stack course)

Frontend:
- Use `NO_ERRORS_SCHEMA` + `overrideComponent` to replace child component imports. Include `CommonModule` in the override imports when templates use `*ngIf`.
- Mock child components need the same `@Input()`/`@Output()` decorators as the real ones.
- Call `TestBed.resetTestingModule()` before `configureTestingModule` when `setupModule` runs mid-test.
- Instantiate `DanishCalendarDateFormatter` inside `TestBed.runInInjectionContext()`.
- The `MatDialog` mock needs `_openDialogs: []`.
- Error-handler tests also need `loadFamilyEvents` mocked to throw.

Backend:
- Use `@ExtendWith(MockitoExtension.class)` with `@Nested`/`@DisplayName`, `@DataJpaTest` for repository slices, and one shared Testcontainers PostgreSQL container.

## 7. Known gaps (DevOps backlog, verified in the code on 2026-09-17)

The full list, with state, reasons, proposed changes and questions for the professor, is in `docs/devops-backlog.md` (IDs A1–K2). Keep both files in sync.

K2 (README, seed scripts, `.gitattributes`, compose project name, dev proxy, CI name, `pom.xml` metadata) is done on branch `fix/k2-repo-housekeeping`, not merged yet.

- **Deploy target is still the full stack setup.** The server path is `~/full-stack-app`, and the secrets have to be added to the new repo. The server's clone may still point at the old remote.
- **`spring.jpa.hibernate.ddl-auto=create-drop` in `application.properties` applies to production too**, so every deploy or restart wipes the prod database, even though a volume is mounted.
- **The JWT secret is hard-coded and committed** in `application.properties`. The dev DB password is also in the override file, which is fine for dev only.
- **`application-test.yml` is in `backend/src/test/java/backend/resources/`**, which is not a resources folder, so the `test` profile loads nothing from it. The right location is `backend/src/test/resources/`.
- **No `spring-boot-starter-actuator`**, yet Playwright waits on `/actuator/health`. That only works because Security answers 401/403, which Playwright counts as "ready". The backend has no compose health check.
- **The server builds the images** (`up --build`). There is no registry, no image tags, and no rollback path.
- The E2E tests do not run in CI. There is no coverage gate, no static analysis beyond ESLint, and no dependency or vulnerability scanning (e.g. Dependabot).
- Node versions drift: CI uses 22, while the Dockerfile and dev image use 24.
- In CI, `npm run build --configuration=production` does not pass the flag on to `ng` (it would need `-- --configuration=production`). This is harmless today because production is the default.
- Routes `test-*` and `edit-member/:id` have no `AuthGuard`. WebSocket allows all origin patterns (`*`).
- The access token lives in web storage, which is exposed to XSS. This is worth discussing in lectures 9–10.
- The root `package.json` has an Angular dependency (`@angular-material-components/datetime-picker`) that doesn't belong at the root.
- **Line endings:** `.gitattributes` (K2) makes text files LF on every OS (`.bat`/`.cmd` stay CRLF), and `git status` from a Linux shell is now clean. Ruby's existing Windows checkout still has CRLF files until it is refreshed (README, "Line endings"). Until then, `prettier --check` fails on a copy of those files (132 files, verified) and `./mvnw`/`seed.sh` fail in a Linux shell; copy and convert them (`sed -i 's/\r$//'`) before running them from the VM.
- **Git from the Linux VM shell:** deletes in the mounted folder are blocked unless Ruby grants delete permission, so git can leave a stale `.git/index.lock` that also blocks git on Windows. Get delete permission before running git commands that write the index, use `git --no-optional-locks status` for read-only checks, and check for `.git/*.lock` afterwards.
- **Missing object-level authorization in `UserController`/`UserService`** (found by reading the code, not yet confirmed by a test): any logged-in family can list all users, read/edit/delete users of other families by ID, change `role`, and call `validate-pin` on another family's users. `POST /api/users` binds the `User` entity directly. (Backlog H2)
- **Member PINs are stored and compared in plain text**, and there is no rate limiting on login or PIN checks. (H3)
- `/api/images/**` is `permitAll`, so `POST /api/images/upload` is public, with no size or type limits. (H2)
- The backend has no loggers. `GlobalExceptionHandler` turns every `RuntimeException` (including not-found and access-denied) into a 500 without logging it. (E2, I3)
- The refresh cookie's `Secure` flag defaults to `false`, and `docker-compose.prod.yml` doesn't override it. (B4)
- There is no `.dockerignore`, and both images run as root. (B1)

## 8. How to work in this repo

- **Communication:** be direct and terse, in plain technical prose, with no padding or academic phrasing. Say honestly what would or wouldn't make a strong exam answer, and state project limitations plainly instead of overclaiming.
- **Iterate:** make a small working version first, then improve it. Don't redesign everything in one go (this matches the lecture's "start small").
- **Code changes:** keep them minimal and targeted, and follow the existing structure and style. Don't restructure or rename unless asked.
- **Tie work to the course:** for each change, say which LO or lecture it serves. Keep the table in section 2 and the gaps in section 7 current.
- **Keep CI green:** before calling frontend work done, run lint, the Prettier check and the tests. For backend work, run `mvnw verify` (it needs Docker; if Docker isn't available, run the specific plain unit test classes with `-Dtest=...`). If you couldn't run something (for example no Java 25, Docker or network in your shell), say so. Never claim it passed.
- **Git:** don't commit, push or open PRs unless asked. Work on branches (`feature/…`, `fix/…`, `bugfix/…`) and open PRs into `main`. CI runs on every PR, and merging to `main` **deploys to production**.
- **Secrets:** never commit secrets, keys or certificates (`certs/` is gitignored). New secrets go in GitHub Actions secrets or environment variables.
- **Environment:** Ruby develops on Windows in IntelliJ. A shell you get may be a Linux VM with this folder mounted, not the Windows host, so tools and line endings differ (see section 7).
- **Language:** code, comments and commit messages are in English. The course slides are in Danish. Reply in the language Ruby writes in.
- **New lecture material:** when Ruby shares a new lecture, add a short "Lecture N: key points" section like the one for lecture 1 and update the table.
