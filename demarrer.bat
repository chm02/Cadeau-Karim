@echo off
REM ==========================================================
REM  Karim Market - Lanceur double-clic
REM  Demarre automatiquement MongoDB, le backend et le frontend.
REM ==========================================================
title Karim Market - Demarrage
cd /d "%~dp0"

echo.
echo   ==============================================
echo     KARIM MARKET - DEMARRAGE AUTOMATIQUE
echo   ==============================================
echo.

powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0scripts\start-all.ps1"
set EXITCODE=%ERRORLEVEL%

echo.
if "%EXITCODE%"=="0" (
    echo   TOUT EST DEMARRE ET FONCTIONNEL.
    echo.
    echo   Ouvrez votre navigateur sur : http://localhost:5173
    echo.
    echo   Laissez cette fenetre ouverte.
    echo   Pour arreter : scripts\stop-all.ps1
) else (
    echo   LE DEMARRAGE A ECHOUE - voir le message ci-dessus.
    echo   Logs : scripts\logs\
)
echo.
pause
