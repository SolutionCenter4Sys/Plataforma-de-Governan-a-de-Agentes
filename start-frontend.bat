@echo off
chcp 65001 >nul
title Plataforma de Agentes AI - Frontend

echo.
echo  ========================================
echo   Plataforma de Agentes AI - Foursys
echo   Frontend React (http://localhost:5173)
echo  ========================================
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo  [1/2] Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo  [ERRO] Falha ao instalar dependencias.
        pause
        exit /b 1
    )
    echo  [1/2] Dependencias instaladas com sucesso!
    echo.
)

echo  [2/2] Iniciando o servidor de desenvolvimento...
echo.
echo  Acesse: http://localhost:5173
echo  Pressione Ctrl+C para parar.
echo.

npm run dev

pause
