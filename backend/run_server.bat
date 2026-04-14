@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ======================================
echo    YemenMarket Backend Server
echo    http://localhost:8000
echo    Admin: http://localhost:8000/admin/
echo ======================================
echo.
venv\Scripts\python.exe manage.py runserver
