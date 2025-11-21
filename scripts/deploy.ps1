# TCS iON Exam System - AWS Deployment Script (PowerShell)
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("infra", "app", "all")]
    [string]$Action = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectName = "exam-system",
    
    [Parameter(Mandatory=$false)]
    [string]$AWSRegion = "us-east-1"
)

# Configuration
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

function Test-AWSCli {
    Write-Info "Checking AWS CLI configuration..."
    
    if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
        Write-Error "AWS CLI is not installed. Please install it first."
        exit 1
    }
    
    try {
        $null = aws sts get-caller-identity 2>$null
    }
    catch {
        Write-Error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    }
    
    Write-Info "AWS CLI is configured correctly."
}

function Test-Docker {
    Write-Info "Checking Docker..."
    
    try {
        $null = docker info 2>$null
    }
    catch {
        Write-Error "Docker is not running. Please start Docker first."
        exit 1
    }
    
    Write-Info "Docker is running."
}

function Deploy-Infrastructure {
    Write-Info "Deploying infrastructure with CloudFormation..."
    
    $StackName = "$ProjectName-infrastructure"
    
    # Check if stack exists
    try {
        $null = aws cloudformation describe-stacks --stack-name $StackName --region $AWSRegion 2>$null
        $StackExists = $true
    }
    catch {
        $StackExists = $false
    }
    
    # Generate random password for MongoDB
    $MongoDBPassword = [System.Web.Security.Membership]::GeneratePassword(32, 8)
    
    if ($StackExists) {
        Write-Info "Stack exists, updating..."
        aws cloudformation update-stack `
            --stack-name $StackName `
            --template-body "file://aws/cloudformation-template.yaml" `
            --parameters "ParameterKey=ProjectName,ParameterValue=$ProjectName" "ParameterKey=Environment,ParameterValue=production" "ParameterKey=MongoDBPassword,ParameterValue=$MongoDBPassword" `
            --capabilities CAPABILITY_NAMED_IAM `
            --region $AWSRegion
    }
    else {
        Write-Info "Creating new stack..."
        aws cloudformation create-stack `
            --stack-name $StackName `
            --template-body "file://aws/cloudformation-template.yaml" `
            --parameters "ParameterKey=ProjectName,ParameterValue=$ProjectName" "ParameterKey=Environment,ParameterValue=production" "ParameterKey=MongoDBPassword,ParameterValue=$MongoDBPassword" `
            --capabilities CAPABILITY_NAMED_IAM `
            --region $AWSRegion
    }
    
    Write-Info "Waiting for stack deployment to complete..."
    if ($StackExists) {
        aws cloudformation wait stack-update-complete --stack-name $StackName --region $AWSRegion
    }
    else {
        aws cloudformation wait stack-create-complete --stack-name $StackName --region $AWSRegion
    }
    
    Write-Info "Infrastructure deployment completed!"
}

function Build-AndPushImage {
    Write-Info "Building and pushing Docker image..."
    
    # Get AWS Account ID
    $AWSAccountId = (aws sts get-caller-identity --query Account --output text)
    $ECRRepository = "$AWSAccountId.dkr.ecr.$AWSRegion.amazonaws.com/$ProjectName"
    
    # Get ECR login token
    $LoginCommand = aws ecr get-login-password --region $AWSRegion
    $LoginCommand | docker login --username AWS --password-stdin $ECRRepository
    
    # Build image
    Write-Info "Building Docker image..."
    docker build -t $ProjectName .
    
    # Tag image
    $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    docker tag "${ProjectName}:latest" "${ECRRepository}:latest"
    docker tag "${ProjectName}:latest" "${ECRRepository}:$Timestamp"
    
    # Push image
    Write-Info "Pushing image to ECR..."
    docker push "${ECRRepository}:latest"
    docker push "${ECRRepository}:$Timestamp"
    
    Write-Info "Image pushed successfully!"
}

function Update-ECSService {
    Write-Info "Updating ECS service..."
    
    # Get AWS Account ID
    $AWSAccountId = (aws sts get-caller-identity --query Account --output text)
    
    # Update task definition with account ID and region
    $TaskDefContent = Get-Content "aws/task-definition.json" -Raw
    $TaskDefContent = $TaskDefContent -replace "YOUR_ACCOUNT_ID", $AWSAccountId
    $TaskDefContent = $TaskDefContent -replace "YOUR_REGION", $AWSRegion
    $TaskDefContent | Out-File -FilePath "$env:TEMP/task-definition.json" -Encoding UTF8
    
    # Register new task definition
    $TaskDefinitionArn = (aws ecs register-task-definition --cli-input-json "file://$env:TEMP/task-definition.json" --region $AWSRegion --query 'taskDefinition.taskDefinitionArn' --output text)
    
    Write-Info "New task definition registered: $TaskDefinitionArn"
    
    # Check if service exists
    try {
        $null = aws ecs describe-services --cluster "$ProjectName-cluster" --services "$ProjectName-service" --region $AWSRegion 2>$null
        $ServiceExists = $true
    }
    catch {
        $ServiceExists = $false
    }
    
    if ($ServiceExists) {
        Write-Info "Updating existing service..."
        aws ecs update-service --cluster "$ProjectName-cluster" --service "$ProjectName-service" --task-definition $TaskDefinitionArn --region $AWSRegion
    }
    else {
        Write-Info "Creating new service..."
        # This would require getting subnet and security group IDs from CloudFormation
        # For simplicity, we'll just update the existing service
        Write-Warn "Service creation from PowerShell not implemented. Please use the bash script or AWS Console."
    }
    
    Write-Info "Waiting for service to stabilize..."
    aws ecs wait services-stable --cluster "$ProjectName-cluster" --services "$ProjectName-service" --region $AWSRegion
    
    Write-Info "Service updated successfully!"
}

function Get-AppUrl {
    $ALBDns = (aws cloudformation describe-stacks --stack-name "$ProjectName-infrastructure" --region $AWSRegion --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' --output text)
    Write-Info "Application is available at: http://$ALBDns"
}

# Main execution
Write-Info "Starting deployment of TCS iON Exam System to AWS..."

Test-AWSCli
Test-Docker

switch ($Action) {
    "infra" {
        Deploy-Infrastructure
    }
    "app" {
        Build-AndPushImage
        Update-ECSService
        Get-AppUrl
    }
    "all" {
        Deploy-Infrastructure
        Build-AndPushImage
        Update-ECSService
        Get-AppUrl
    }
}

Write-Info "Deployment completed successfully!"
