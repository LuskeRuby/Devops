@echo off
setlocal
rem Seeds the dev database. Start the dev stack first (docker compose up) and
rem wait until the backend is up: Hibernate creates the tables on startup.
rem Override the defaults with POSTGRES_USER / POSTGRES_DB if you changed them.
if not defined POSTGRES_USER set POSTGRES_USER=admin
if not defined POSTGRES_DB set POSTGRES_DB=familyapp
rem Run from the repo root so docker compose finds docker-compose.yml.
cd /d "%~dp0..\.."
echo Seeding PostgreSQL database...
docker compose exec -T postgres psql -U %POSTGRES_USER% -d %POSTGRES_DB% < scripts\seed\seed.sql
if errorlevel 1 exit /b 1
echo Seeding complete!
