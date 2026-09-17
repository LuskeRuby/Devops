@echo off
setlocal
rem Seeds the dev database. Start the dev stack first (docker compose up) and
rem wait until the backend is up: Hibernate creates the tables on startup.
cd /d "%~dp0"
echo Seeding PostgreSQL database...
docker compose exec -T postgres psql -U admin -d familyapp < seed.sql
if errorlevel 1 exit /b 1
echo Seeding complete!
