@echo off
title ZGJ Startup

set ROOT=%~dp0

echo ==============================================
echo   ZGJ - Start All Services
echo ==============================================

:: ---------- 1. PostgreSQL ----------
echo.
echo [1/4] Checking PostgreSQL...
sc query postgresql-x64-17 | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo   [OK] PostgreSQL is running
) else (
    echo   Starting PostgreSQL...
    net start postgresql-x64-17 >nul 2>&1
    if %errorlevel% neq 0 (
        echo   [WARN] Cannot start PostgreSQL, please start manually
    )
)

:: ---------- 2. LangChain ----------
echo.
echo [2/4] Starting LangChain (8890)...
start "LangChain" /D "%ROOT%langchain-service" cmd /c "npm run dev"

:: ---------- 3. Go Backend ----------
echo.
echo [3/4] Starting Go Backend (8888)...
start "Backend" /D "%ROOT%server" cmd /c "go run main.go"

:: ---------- 4. Frontend ----------
echo.
echo [4/4] Starting Frontend (8080)...
start "Frontend" /D "%ROOT%web" cmd /c "pnpm dev"

:: ---------- Done ----------
echo.
echo ==============================================
echo   All services starting...
echo.
echo   Frontend : http://localhost:8080
echo   API      : http://localhost:8888/api
echo   AI       : http://localhost:8890
echo.
echo   Close each window to stop its service
echo ==============================================
pause
