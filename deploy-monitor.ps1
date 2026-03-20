#Requires -Version 5.1
<#
.SYNOPSIS
    Faz commit, push e monitora o GitHub Actions até a aplicação compilar com sucesso.
.DESCRIPTION
    1. Verifica pré-requisitos (git, gh CLI)
    2. Adiciona todos os arquivos modificados
    3. Faz commit com mensagem customizável
    4. Faz push para a branch main
    5. Aguarda o GitHub Actions disparar e monitora em loop
    6. Exibe resultado final (sucesso ou falha)
.EXAMPLE
    .\deploy-monitor.ps1
    .\deploy-monitor.ps1 -CommitMessage "feat: nova funcionalidade de governança"
    .\deploy-monitor.ps1 -MaxWaitMinutes 15
#>

param(
    [string]$CommitMessage = "fix: corrige output_location no workflow Azure SWA",
    [int]$MaxWaitMinutes = 15,
    [int]$PollIntervalSeconds = 20
)

# ── Cores ────────────────────────────────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n  ► $msg" -ForegroundColor Cyan }
function Write-OK    { param($msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "  ✗ $msg" -ForegroundColor Red }
function Write-Info  { param($msg) Write-Host "    $msg" -ForegroundColor Gray }

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "  ║    Plataforma de Governança de Agentes               ║" -ForegroundColor Magenta
Write-Host "  ║    Deploy & Monitor — Azure Static Web Apps          ║" -ForegroundColor Magenta
Write-Host "  ║    Foursys | 2026                                    ║" -ForegroundColor Magenta
Write-Host "  ╚══════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# ── 1. Pré-requisitos ────────────────────────────────────────────────────────
Write-Step "Verificando pré-requisitos..."

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Fail "git não encontrado. Instale o Git e tente novamente."
    exit 1
}
Write-OK "git $(git --version)"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Fail "GitHub CLI (gh) não encontrado."
    Write-Info "Instale em: https://cli.github.com/"
    Write-Info "Após instalar, execute: gh auth login"
    exit 1
}
Write-OK "gh $(gh --version | Select-Object -First 1)"

# Verificar autenticação gh
$ghAuth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail "GitHub CLI não autenticado. Execute: gh auth login"
    exit 1
}
Write-OK "GitHub CLI autenticado"

# ── 2. Verificar repo git ────────────────────────────────────────────────────
Write-Step "Verificando repositório git..."

$repoRoot = git rev-parse --show-toplevel 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Não é um repositório git. Execute: git init && git remote add origin <URL>"
    exit 1
}

$remoteUrl = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Nenhum remote 'origin' configurado."
    Write-Info "Execute: git remote add origin https://github.com/SolutionCenter4Sys/Plataforma-de-Governan-a-de-Agentes.git"
    exit 1
}
Write-OK "Remote: $remoteUrl"

$branch = git rev-parse --abbrev-ref HEAD
Write-OK "Branch atual: $branch"

# Extrair owner/repo da URL remota
$repoSlug = $remoteUrl -replace '.*github\.com[:/]', '' -replace '\.git$', ''
Write-Info "Repositório GitHub: $repoSlug"

# ── 3. Commit ────────────────────────────────────────────────────────────────
Write-Step "Preparando commit..."

git add -A
$statusOutput = git status --short
if (-not $statusOutput) {
    Write-Warn "Nenhuma alteração para commitar. Fazendo push forçado da branch..."
} else {
    Write-Info "Arquivos alterados:"
    $statusOutput | ForEach-Object { Write-Info "  $_" }

    git commit -m $CommitMessage
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Falha ao criar commit."
        exit 1
    }
    Write-OK "Commit criado: $CommitMessage"
}

# ── 4. Push ──────────────────────────────────────────────────────────────────
Write-Step "Fazendo push para origin/$branch..."

git push origin $branch
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Falha no push. Verifique sua conexão e permissões."
    exit 1
}
Write-OK "Push realizado com sucesso!"

# ── 5. Aguardar disparo do workflow ──────────────────────────────────────────
Write-Step "Aguardando GitHub Actions disparar o workflow..."
Start-Sleep -Seconds 8

# Buscar o run mais recente
$maxWaitSeconds = $MaxWaitMinutes * 60
$elapsed = 0
$runId = $null

while ($elapsed -lt 30) {
    $runs = gh run list --repo $repoSlug --branch $branch --limit 1 --json databaseId,status,conclusion,name,createdAt 2>&1 | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($runs -and $runs.Count -gt 0) {
        $runId = $runs[0].databaseId
        Write-OK "Workflow detectado (Run ID: $runId)"
        Write-Info "Nome: $($runs[0].name)"
        Write-Info "Criado: $($runs[0].createdAt)"
        break
    }
    Write-Info "Aguardando workflow ser detectado... ($elapsed s)"
    Start-Sleep -Seconds 5
    $elapsed += 5
}

if (-not $runId) {
    Write-Warn "Workflow não detectado em 30s. Verifique manualmente em:"
    Write-Info "https://github.com/$repoSlug/actions"
    exit 1
}

# ── 6. Monitorar em loop ─────────────────────────────────────────────────────
Write-Step "Monitorando execução (máximo $MaxWaitMinutes min, polling a cada ${PollIntervalSeconds}s)..."
Write-Info "Acompanhe em: https://github.com/$repoSlug/actions/runs/$runId"
Write-Host ""

$startTime = Get-Date
$attempt = 0

while ($true) {
    $elapsed = ((Get-Date) - $startTime).TotalSeconds
    if ($elapsed -gt $maxWaitSeconds) {
        Write-Warn "Timeout de $MaxWaitMinutes minutos atingido sem conclusão."
        Write-Info "Verifique: https://github.com/$repoSlug/actions/runs/$runId"
        exit 1
    }

    $attempt++
    $runInfo = gh run view $runId --repo $repoSlug --json status,conclusion,jobs 2>&1 | ConvertFrom-Json -ErrorAction SilentlyContinue

    if (-not $runInfo) {
        Write-Info "[$attempt] Aguardando dados do run... (${elapsed}s)"
        Start-Sleep -Seconds $PollIntervalSeconds
        continue
    }

    $status     = $runInfo.status
    $conclusion = $runInfo.conclusion

    # Exibir jobs em execução
    $jobsStatus = ""
    if ($runInfo.jobs) {
        $jobsStatus = ($runInfo.jobs | ForEach-Object {
            $icon = switch ($_.status) {
                "completed"   { if ($_.conclusion -eq "success") { "✓" } else { "✗" } }
                "in_progress" { "⟳" }
                default       { "○" }
            }
            "$icon $($_.name)"
        }) -join " | "
    }

    $elapsedFmt = [math]::Round($elapsed)
    Write-Host "  [$attempt] ${elapsedFmt}s | Status: $status $($conclusion ? "→ $conclusion" : '') | $jobsStatus" -ForegroundColor $(
        if ($status -eq "completed" -and $conclusion -eq "success") { "Green" }
        elseif ($status -eq "completed") { "Red" }
        else { "Yellow" }
    )

    # Verificar conclusão
    if ($status -eq "completed") {
        Write-Host ""
        if ($conclusion -eq "success") {
            Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Green
            Write-Host "  ║  ✓ DEPLOY CONCLUÍDO COM SUCESSO!             ║" -ForegroundColor Green
            Write-Host "  ║    Plataforma de Governança está live!       ║" -ForegroundColor Green
            Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Green

            # Tentar obter a URL do site
            $swaUrl = gh run view $runId --repo $repoSlug --log 2>&1 | Select-String "https://.*\.azurestaticapps\.net" | Select-Object -First 1
            if ($swaUrl) { Write-OK "URL: $swaUrl" }
        } else {
            Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Red
            Write-Host "  ║  ✗ DEPLOY FALHOU (conclusion: $conclusion)" -ForegroundColor Red
            Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Red
            Write-Info "Logs detalhados: https://github.com/$repoSlug/actions/runs/$runId"

            # Exibir últimas linhas do log com erro
            Write-Host "`n  Últimas linhas do log de erro:" -ForegroundColor Red
            gh run view $runId --repo $repoSlug --log-failed 2>&1 | Select-Object -Last 30 | ForEach-Object {
                Write-Host "  $_" -ForegroundColor DarkRed
            }
        }
        Write-Host ""
        exit $(if ($conclusion -eq "success") { 0 } else { 1 })
    }

    Start-Sleep -Seconds $PollIntervalSeconds
}
