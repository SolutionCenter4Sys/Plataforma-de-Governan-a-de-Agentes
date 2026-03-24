@echo off
setlocal

cd /d "%~dp0"

echo Iniciando Plataforma de Governanca de Agentes em modo mock...
echo.

call npm run dev:mock

endlocal
