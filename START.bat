@echo off
cd /d "%~dp0"
title YemenMarket - Full System Startup
color 0A

echo.
echo ===================================================
echo     YemenMarket - Full System Startup v2.0
echo ===================================================
echo.

cd backend

echo [Step 1] Installing Backend Dependencies...
echo -----------------------------------------
venv\Scripts\pip.exe install -r requirements.txt -q
echo Done!
echo.

echo [Step 2] Setting up Database (Migrations)...
echo -----------------------------------------
venv\Scripts\python.exe manage.py makemigrations users
venv\Scripts\python.exe manage.py makemigrations vendors
venv\Scripts\python.exe manage.py makemigrations products
venv\Scripts\python.exe manage.py makemigrations orders
venv\Scripts\python.exe manage.py makemigrations notifications
venv\Scripts\python.exe manage.py makemigrations shipping
venv\Scripts\python.exe manage.py migrate
echo Done!
echo.

echo [Step 3] Loading / Updating Data (Seed)...
echo -----------------------------------------
echo Ensuring user accounts and data are up to date...
venv\Scripts\python.exe seed_data.py
echo Done!
echo.

echo [Step 4] Starting Backend Server (Django)...
echo -----------------------------------------
start "YemenMarket Backend" cmd /k "cd /d %cd% && venv\Scripts\python.exe manage.py runserver"
echo Backend running at: http://localhost:8000
echo.

echo [Step 5] Starting Frontend Server (React)...
echo -----------------------------------------
cd ..\frontend
start "YemenMarket Frontend" cmd /k "cd /d %cd% && npm run dev"
echo Frontend running at: http://localhost:5173
echo.

timeout /t 5 >nul

echo [Step 6] Opening browser...
echo -----------------------------------------
start http://localhost:5173

echo.
echo ===================================================
echo          System Started Successfully!
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:8000/api/
echo   Admin:     http://localhost:8000/admin/
echo.
echo   Login Accounts:
echo   Admin:    admin    / admin123
echo   Vendor:   vendor   / vendor123
echo   Customer: customer / customer123
echo ===================================================
echo.
echo Press any key to close this window...
echo (The servers will keep running in their own windows)
pause >nul
