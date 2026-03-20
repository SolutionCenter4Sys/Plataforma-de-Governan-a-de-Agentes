@echo off
chcp 65001 >nul
title Plataforma de Governança de Agentes — Push e Monitorar Deploy

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║    Plataforma de Governança de Agentes               ║
echo  ║    Push + Monitor Azure Static Web Apps              ║
echo  ║    Fix: output_location = dist                       ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  IMPORTANTE: Verifique o nome do secret no arquivo:
echo    .github\workflows\azure-static-web-apps-*.yml
echo.
echo  O nome correto esta em:
echo    GitHub repo ^> Settings ^> Secrets and variables ^> Actions
echo.
echo  Repositorio: SolutionCenter4Sys/Plataforma-de-Governan-a-de-Agentes
echo.
echo  Pressione ENTER para continuar ou CTRL+C para cancelar.
pause >nul

cd /d "%~dp0"

:: ── Verificar pre-requisitos ─────────────────────────────────────────────────
git --version >nul 2>&1
if errorlevel 1 (
    echo  [ERRO] git nao encontrado.
    pause & exit /b 1
)

:: Obter remote URL
for /f "usebackq tokens=*" %%i in (`git remote get-url origin 2^>nul`) do set REMOTE_URL=%%i
if "%REMOTE_URL%"=="" (
    echo  [ERRO] Nenhum remote 'origin' configurado.
    echo  Execute: git remote add origin https://github.com/SolutionCenter4Sys/Plataforma-de-Governan-a-de-Agentes.git
    pause & exit /b 1
)
echo  Remote: %REMOTE_URL%

:: ── Git add + commit + push ──────────────────────────────────────────────────
echo.
echo  [1/3] Verificando alteracoes...
git status --short

git add -A

git diff --cached --quiet
if errorlevel 1 (
    echo.
    echo  [1/3] Criando commit com a correcao do workflow...
    git commit -m "fix: corrige output_location=dist nos workflows Azure Static Web Apps"
    if errorlevel 1 (
        echo  [ERRO] Falha ao criar commit.
        pause & exit /b 1
    )
    echo  [OK] Commit criado!
) else (
    echo  [OK] Sem alteracoes novas para commitar.
    echo  [OK] Forcando push do estado atual...
)

echo.
echo  [2/3] Fazendo push para GitHub...
git push origin HEAD
if errorlevel 1 (
    echo  [ERRO] Falha no push. Verifique autenticacao.
    pause & exit /b 1
)
echo  [OK] Push realizado!

:: ── Monitorar ────────────────────────────────────────────────────────────────
echo.
echo  [3/3] Iniciando monitoramento do GitHub Actions...
echo.

gh --version >nul 2>&1
if errorlevel 1 (
    echo  [AVISO] GitHub CLI nao instalado. Monitore manualmente:
    echo.
    echo  Acesse seu repositorio no GitHub ^> aba "Actions"
    echo  URL: %REMOTE_URL%
    echo.
    echo  Instale o GitHub CLI em: https://cli.github.com/
    pause & exit /b 0
)

:: Aguardar workflow disparar
echo  Aguardando 12 segundos para o workflow ser disparado...
timeout /t 12 /nobreak >nul

:: Executar script PowerShell de monitoramento
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-monitor.ps1"

pause
