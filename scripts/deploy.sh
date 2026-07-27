#!/bin/bash

# Beeja Exam Management - AWS Deployment Script
set -e

# Configuration
PROJECT_NAME="exam-system"
AWS_REGION="us-east-1"  # Change to your preferred region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed and configured
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi

    if ! aws sts get-caller-identity &> /dev/null; then
        echo_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
}

# Check if Docker is running
check_docker() {
    if ! docker info &> /dev/null; then
        echo_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Deploy CloudFormation stack
deploy_infrastructure() {
    echo_info "Deploying infrastructure with CloudFormation..."
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name ${PROJECT_NAME}-infrastructure --region ${AWS_REGION} &> /dev/null; then
        echo_info "Stack exists, updating..."
        aws cloudformation update-stack \
            --stack-name ${PROJECT_NAME}-infrastructure \
            --template-body file://aws/cloudformation-template.yaml \
            --parameters ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME} \
                        ParameterKey=Environment,ParameterValue=production \
                        ParameterKey=MongoDBPassword,ParameterValue=$(openssl rand -base64 32) \
            --capabilities CAPABILITY_NAMED_IAM \
            --region ${AWS_REGION}
    else
        echo_info "Creating new stack..."
        aws cloudformation create-stack \
            --stack-name ${PROJECT_NAME}-infrastructure \
            --template-body file://aws/cloudformation-template.yaml \
            --parameters ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME} \
                        ParameterKey=Environment,ParameterValue=production \
                        ParameterKey=MongoDBPassword,ParameterValue=$(openssl rand -base64 32) \
            --capabilities CAPABILITY_NAMED_IAM \
            --region ${AWS_REGION}
    fi

    echo_info "Waiting for stack deployment to complete..."
    aws cloudformation wait stack-create-complete --stack-name ${PROJECT_NAME}-infrastructure --region ${AWS_REGION} || \
    aws cloudformation wait stack-update-complete --stack-name ${PROJECT_NAME}-infrastructure --region ${AWS_REGION}
    
    echo_info "Infrastructure deployment completed!"
}

# Build and push Docker image
build_and_push_image() {
    echo_info "Building Docker image..."
    
    # Get ECR login token
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REPOSITORY}
    
    # Build image
    docker build -t ${PROJECT_NAME} .
    
    # Tag image
    docker tag ${PROJECT_NAME}:latest ${ECR_REPOSITORY}:latest
    docker tag ${PROJECT_NAME}:latest ${ECR_REPOSITORY}:$(date +%Y%m%d-%H%M%S)
    
    # Push image
    echo_info "Pushing image to ECR..."
    docker push ${ECR_REPOSITORY}:latest
    docker push ${ECR_REPOSITORY}:$(date +%Y%m%d-%H%M%S)
    
    echo_info "Image pushed successfully!"
}

# Update ECS service
update_ecs_service() {
    echo_info "Updating ECS service..."
    
    # Update task definition with new image
    sed "s/YOUR_ACCOUNT_ID/${AWS_ACCOUNT_ID}/g; s/YOUR_REGION/${AWS_REGION}/g" aws/task-definition.json > /tmp/task-definition.json
    
    # Register new task definition
    TASK_DEFINITION_ARN=$(aws ecs register-task-definition \
        --cli-input-json file:///tmp/task-definition.json \
        --region ${AWS_REGION} \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text)
    
    echo_info "New task definition registered: ${TASK_DEFINITION_ARN}"
    
    # Update service (create if doesn't exist)
    if aws ecs describe-services --cluster ${PROJECT_NAME}-cluster --services ${PROJECT_NAME}-service --region ${AWS_REGION} &> /dev/null; then
        echo_info "Updating existing service..."
        aws ecs update-service \
            --cluster ${PROJECT_NAME}-cluster \
            --service ${PROJECT_NAME}-service \
            --task-definition ${TASK_DEFINITION_ARN} \
            --region ${AWS_REGION}
    else
        echo_info "Creating new service..."
        # Get subnet and security group IDs from CloudFormation
        SUBNET_IDS=$(aws cloudformation describe-stacks \
            --stack-name ${PROJECT_NAME}-infrastructure \
            --region ${AWS_REGION} \
            --query 'Stacks[0].Outputs[?OutputKey==`PublicSubnet1`].OutputValue' \
            --output text),$(aws cloudformation describe-stacks \
            --stack-name ${PROJECT_NAME}-infrastructure \
            --region ${AWS_REGION} \
            --query 'Stacks[0].Outputs[?OutputKey==`PublicSubnet2`].OutputValue' \
            --output text)
        
        SECURITY_GROUP_ID=$(aws cloudformation describe-stacks \
            --stack-name ${PROJECT_NAME}-infrastructure \
            --region ${AWS_REGION} \
            --query 'Stacks[0].Outputs[?OutputKey==`ECSSecurityGroup`].OutputValue' \
            --output text)
        
        TARGET_GROUP_ARN=$(aws cloudformation describe-stacks \
            --stack-name ${PROJECT_NAME}-infrastructure \
            --region ${AWS_REGION} \
            --query 'Stacks[0].Outputs[?OutputKey==`ALBTargetGroup`].OutputValue' \
            --output text)
        
        aws ecs create-service \
            --cluster ${PROJECT_NAME}-cluster \
            --service-name ${PROJECT_NAME}-service \
            --task-definition ${TASK_DEFINITION_ARN} \
            --desired-count 2 \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_IDS}],securityGroups=[${SECURITY_GROUP_ID}],assignPublicIp=ENABLED}" \
            --load-balancers "targetGroupArn=${TARGET_GROUP_ARN},containerName=exam-app,containerPort=5000" \
            --region ${AWS_REGION}
    fi
    
    echo_info "Waiting for service to stabilize..."
    aws ecs wait services-stable --cluster ${PROJECT_NAME}-cluster --services ${PROJECT_NAME}-service --region ${AWS_REGION}
    
    echo_info "Service updated successfully!"
}

# Get application URL
get_app_url() {
    ALB_DNS=$(aws cloudformation describe-stacks \
        --stack-name ${PROJECT_NAME}-infrastructure \
        --region ${AWS_REGION} \
        --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
        --output text)
    
    echo_info "Application is available at: http://${ALB_DNS}"
}

# Main deployment function
main() {
    echo_info "Starting deployment of Beeja Exam Management to AWS..."
    
    check_aws_cli
    check_docker
    
    # Parse command line arguments
    case "${1:-all}" in
        "infra")
            deploy_infrastructure
            ;;
        "app")
            build_and_push_image
            update_ecs_service
            get_app_url
            ;;
        "all")
            deploy_infrastructure
            build_and_push_image
            update_ecs_service
            get_app_url
            ;;
        *)
            echo_error "Usage: $0 [infra|app|all]"
            echo_info "  infra - Deploy only infrastructure"
            echo_info "  app   - Deploy only application"
            echo_info "  all   - Deploy everything (default)"
            exit 1
            ;;
    esac
    
    echo_info "Deployment completed successfully!"
}

# Run main function
main "$@"
