# CodeGymnasium Quick Start Guide

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CodeGymnasium Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js installation
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}
$nodeVersion = node --version
Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green

# Check npm installation
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm is not installed" -ForegroundColor Red
    exit 1
}
$npmVersion = npm --version
Write-Host "✅ npm $npmVersion detected" -ForegroundColor Green

# Check Docker installation (optional)
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "✅ Docker detected" -ForegroundColor Green
    $hasDocker = $true
} else {
    Write-Host "⚠️  Docker not found. You'll need to install databases manually" -ForegroundColor Yellow
    $hasDocker = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Step 1: Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (!(Test-Path .env)) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ .env file created. Please update with your configuration" -ForegroundColor Green
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Step 2: Install Dependencies" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$installDeps = Read-Host "Install dependencies? (y/n)"
if ($installDeps -eq "y") {
    Write-Host "Installing root dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
    
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend/services/auth-service
    npm install
    Set-Location ../../..
    
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Step 3: Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($hasDocker) {
    $setupDb = Read-Host "Start databases with Docker? (y/n)"
    if ($setupDb -eq "y") {
        Write-Host "Starting PostgreSQL, MongoDB, Redis, and RabbitMQ..." -ForegroundColor Yellow
        docker-compose up -d postgres mongodb redis rabbitmq
        Write-Host "✅ Databases started successfully" -ForegroundColor Green
        Write-Host "Waiting for databases to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        Write-Host "✅ Databases are ready" -ForegroundColor Green
    }
} else {
    Write-Host "Please install and configure the following databases manually:" -ForegroundColor Yellow
    Write-Host "  - PostgreSQL 15+" -ForegroundColor White
    Write-Host "  - MongoDB 7+" -ForegroundColor White
    Write-Host "  - Redis 7+" -ForegroundColor White
    Write-Host "  - RabbitMQ 3+" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "  1. Update .env file with your configuration" -ForegroundColor White
Write-Host "  2. Run 'npm run dev' to start all services" -ForegroundColor White
Write-Host "  3. Visit http://localhost:3001 for the frontend" -ForegroundColor White
Write-Host "  4. API Gateway will be available at http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Green
Write-Host "  npm run dev              - Start all services" -ForegroundColor White
Write-Host "  npm run dev:frontend     - Start frontend only" -ForegroundColor White
Write-Host "  npm run dev:backend      - Start backend only" -ForegroundColor White
Write-Host "  docker-compose up        - Start all services with Docker" -ForegroundColor White
Write-Host "  docker-compose down      - Stop all Docker services" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see README.md" -ForegroundColor Cyan
Write-Host ""
