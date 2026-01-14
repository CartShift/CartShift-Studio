@echo off
echo 🚀 CartShift Studio - Smart Dev Server Manager
echo ==================================================

echo 🔍 Checking for existing Next.js dev processes...

REM Kill any existing next dev processes (simple approach)
taskkill /IM node.exe /F >nul 2>&1
if %errorlevel% == 0 (
    echo 🛑 Terminated existing Node.js processes.
    ping -n 4 127.0.0.1 >nul
) else (
    echo ✅ No existing Node.js processes found.
)

REM Clear Next.js cache
echo 🧹 Clearing Next.js cache...
if exist ".next" (
    rmdir /s /q ".next" 2>nul
    echo   ✅ Cache cleared.
) else (
    echo   ℹ️  No cache directory found.
)

echo.
echo 🚀 Starting Next.js development server...
echo ==================================================

REM Use the legacy dev command
pnpm run dev:legacy