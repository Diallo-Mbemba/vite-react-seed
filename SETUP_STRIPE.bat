@echo off
echo ===============================================================
echo   Configuration Automatique Stripe
echo ===============================================================
echo.

REM Executer le script PowerShell avec politique bypassee
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0SETUP_STRIPE.ps1"

pause

