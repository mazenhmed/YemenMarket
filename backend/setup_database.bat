@echo off
chcp 65001 >nul
echo.
echo ======================================
echo    YemenMarket - Setup Database
echo ======================================
echo.

cd /d "%~dp0"

echo [1/5] Creating migrations for Users...
venv\Scripts\python.exe manage.py makemigrations users
echo.

echo [2/5] Creating migrations for Vendors...
venv\Scripts\python.exe manage.py makemigrations vendors
echo.

echo [3/5] Creating migrations for Products...
venv\Scripts\python.exe manage.py makemigrations products
echo.

echo [4/5] Creating migrations for Orders...
venv\Scripts\python.exe manage.py makemigrations orders
echo.

echo [5/5] Applying migrations to database...
venv\Scripts\python.exe manage.py migrate
echo.

echo ======================================
echo    Database created successfully!
echo ======================================
echo.
echo Now creating admin account...
echo Username: admin
echo Email: admin@yemenmarket.com
echo.
venv\Scripts\python.exe manage.py createsuperuser --username admin --email admin@yemenmarket.com
echo.
echo ======================================
echo    DONE! Now run the server:
echo    venv\Scripts\python.exe manage.py runserver
echo ======================================
pause
