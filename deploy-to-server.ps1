# TCS iON Exam System - Server Deployment Script
param(
    [Parameter(Mandatory=$false)]
    [string]$ServerIP = "54.91.136.135",
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "ubuntu",
    
    [Parameter(Mandatory=$false)]
    [string]$KeyPath = "",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("deploy", "update", "stop", "logs", "status")]
    [string]$Action = "deploy"
)

$ErrorActionPreference = "Stop"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check if Docker is installed locally
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed locally. Please install Docker Desktop."
        exit 1
    }
    
    # Check if SSH key exists
    if ($KeyPath -and -not (Test-Path $KeyPath)) {
        Write-Error "SSH key file not found: $KeyPath"
        exit 1
    }
    
    Write-Info "Prerequisites check passed."
}

function Build-Application {
    Write-Info "Building application..."
    
    # Build frontend
    Write-Info "Building frontend..."
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Frontend build failed"
        exit 1
    }
    
    # Build Docker image
    Write-Info "Building Docker image..."
    docker build -t exam-system:latest .
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker build failed"
        exit 1
    }
    
    Write-Info "Application built successfully."
}

function Deploy-ToServer {
    Write-Info "Deploying to server $ServerIP..."
    
    # Create deployment package
    $TempDir = "$env:TEMP\exam-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
    
    # Copy necessary files
    Copy-Item "docker-compose.prod.yml" "$TempDir\docker-compose.yml"
    Copy-Item -Recurse "nginx" "$TempDir\"
    
    # Create deployment script for server
    $DeployScript = @"
#!/bin/bash
set -e

echo "Starting deployment..."

# Update system
sudo apt-get update

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker `$USER
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-`$(uname -s)-`$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create application directory
sudo mkdir -p /opt/exam-system
cd /opt/exam-system

# Stop existing containers
sudo docker-compose down 2>/dev/null || true

# Start new deployment
echo "Starting containers..."
sudo docker-compose up -d

# Wait for health check
echo "Waiting for application to start..."
sleep 30

# Check if application is running
if curl -f http://localhost/api/health; then
    echo "Deployment successful! Application is running."
    echo "Access your application at: http://$ServerIP"
else
    echo "Deployment may have issues. Check logs with: sudo docker-compose logs"
fi
"@

    $DeployScript | Out-File -FilePath "$TempDir\deploy.sh" -Encoding UTF8
    
    # Create archive
    $ArchivePath = "$TempDir.zip"
    Compress-Archive -Path "$TempDir\*" -DestinationPath $ArchivePath -Force
    
    # Upload and execute
    $SSHCommand = if ($KeyPath) { "ssh -i `"$KeyPath`"" } else { "ssh" }
    $SCPCommand = if ($KeyPath) { "scp -i `"$KeyPath`"" } else { "scp" }
    
    Write-Info "Uploading deployment package..."
    & $SCPCommand $ArchivePath "${Username}@${ServerIP}:/tmp/exam-deployment.zip"
    
    Write-Info "Executing deployment on server..."
    & $SSHCommand "${Username}@${ServerIP}" @"
cd /tmp
unzip -o exam-deployment.zip
sudo mkdir -p /opt/exam-system
sudo cp -r * /opt/exam-system/
cd /opt/exam-system
chmod +x deploy.sh
./deploy.sh
"@
    
    # Cleanup
    Remove-Item -Recurse -Force $TempDir
    Remove-Item -Force $ArchivePath
    
    Write-Info "Deployment completed!"
}

function Show-Status {
    $SSHCommand = if ($KeyPath) { "ssh -i `"$KeyPath`"" } else { "ssh" }
    
    Write-Info "Checking application status on $ServerIP..."
    & $SSHCommand "${Username}@${ServerIP}" "cd /opt/exam-system && sudo docker-compose ps"
}

function Show-Logs {
    $SSHCommand = if ($KeyPath) { "ssh -i `"$KeyPath`"" } else { "ssh" }
    
    Write-Info "Showing application logs from $ServerIP..."
    & $SSHCommand "${Username}@${ServerIP}" "cd /opt/exam-system && sudo docker-compose logs -f --tail=100"
}

function Stop-Application {
    $SSHCommand = if ($KeyPath) { "ssh -i `"$KeyPath`"" } else { "ssh" }
    
    Write-Info "Stopping application on $ServerIP..."
    & $SSHCommand "${Username}@${ServerIP}" "cd /opt/exam-system && sudo docker-compose down"
}

# Main execution
Write-Info "TCS iON Exam System - Server Deployment"
Write-Info "Target Server: $ServerIP"
Write-Info "Action: $Action"

Test-Prerequisites

switch ($Action) {
    "deploy" {
        Build-Application
        Deploy-ToServer
        Write-Info "Application deployed successfully!"
        Write-Info "Access your exam system at: http://$ServerIP"
    }
    "update" {
        Build-Application
        Deploy-ToServer
    }
    "status" {
        Show-Status
    }
    "logs" {
        Show-Logs
    }
    "stop" {
        Stop-Application
    }
}

Write-Info "Operation completed!"
