# TCS iON Exam System - AWS Deployment Guide

## Overview

This guide provides step-by-step instructions to deploy your TCS iON Exam System to AWS using Docker containers, ECS (Elastic Container Service), and other AWS services.

## Architecture

The deployment includes:
- **ECS Fargate**: Serverless container hosting
- **DocumentDB**: MongoDB-compatible database
- **Application Load Balancer**: Traffic distribution and SSL termination
- **ECR**: Container image registry
- **Secrets Manager**: Secure credential storage
- **CloudWatch**: Logging and monitoring
- **VPC**: Network isolation and security

## Prerequisites

### 1. AWS Account Setup
- AWS account with appropriate permissions
- AWS CLI installed and configured
- Docker installed and running

### 2. Required AWS Permissions
Your AWS user/role needs the following permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:*",
                "ecs:*",
                "ecr:*",
                "ec2:*",
                "elasticloadbalancing:*",
                "iam:*",
                "logs:*",
                "secretsmanager:*",
                "rds:*",
                "docdb:*"
            ],
            "Resource": "*"
        }
    ]
}
```

## Deployment Options

### Option 1: Automated Deployment (Recommended)

#### For Windows (PowerShell):
```powershell
# Navigate to project directory
cd d:\Exam

# Make script executable and run
.\scripts\deploy.ps1 -Action all -AWSRegion us-east-1
```

#### For Linux/Mac (Bash):
```bash
# Navigate to project directory
cd /path/to/Exam

# Make script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh all
```

### Option 2: Manual Step-by-Step Deployment

#### Step 1: Configure AWS CLI
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, Region, and output format
```

#### Step 2: Deploy Infrastructure
```bash
# Deploy CloudFormation stack
aws cloudformation create-stack \
    --stack-name exam-system-infrastructure \
    --template-body file://aws/cloudformation-template.yaml \
    --parameters ParameterKey=ProjectName,ParameterValue=exam-system \
                ParameterKey=Environment,ParameterValue=production \
                ParameterKey=MongoDBPassword,ParameterValue=YourSecurePassword123! \
    --capabilities CAPABILITY_NAMED_IAM \
    --region us-east-1

# Wait for completion
aws cloudformation wait stack-create-complete \
    --stack-name exam-system-infrastructure \
    --region us-east-1
```

#### Step 3: Build and Push Docker Image
```bash
# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-east-1"
ECR_REPOSITORY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/exam-system"

# Login to ECR
aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin ${ECR_REPOSITORY}

# Build and tag image
docker build -t exam-system .
docker tag exam-system:latest ${ECR_REPOSITORY}:latest

# Push image
docker push ${ECR_REPOSITORY}:latest
```

#### Step 4: Deploy ECS Service
```bash
# Update task definition with your account details
sed "s/YOUR_ACCOUNT_ID/${AWS_ACCOUNT_ID}/g; s/YOUR_REGION/${AWS_REGION}/g" \
    aws/task-definition.json > /tmp/task-definition.json

# Register task definition
aws ecs register-task-definition \
    --cli-input-json file:///tmp/task-definition.json \
    --region ${AWS_REGION}

# Create ECS service (get subnet and security group IDs from CloudFormation outputs)
# This step requires additional configuration - use the automated script for simplicity
```

## Environment Variables

The application uses the following environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Application port | `5000` |
| `MONGODB_URI` | Database connection string | `mongodb://user:pass@host:27017/db` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |

## Database Setup

### DocumentDB Configuration
The CloudFormation template creates a DocumentDB cluster with:
- **Instance Class**: `db.t3.medium` (adjustable)
- **Backup Retention**: 7 days
- **Encryption**: Enabled
- **VPC**: Private subnets only

### Initial Data Migration
If you have existing data, you can migrate it using:

```bash
# Export from existing MongoDB
mongodump --uri="mongodb://localhost:27017/exam-module" --out=./backup

# Import to DocumentDB (requires VPN or bastion host)
mongorestore --uri="mongodb://username:password@docdb-cluster.amazonaws.com:27017/exam-module?ssl=true" ./backup/exam-module
```

## SSL/TLS Configuration

### Option 1: AWS Certificate Manager (Recommended)
1. Request a certificate in ACM
2. Update the ALB listener to use HTTPS
3. Redirect HTTP to HTTPS

### Option 2: Let's Encrypt with Nginx
Update the `nginx.conf` file to include SSL configuration and use certbot for certificate generation.

## Monitoring and Logging

### CloudWatch Logs
- Application logs: `/ecs/exam-system`
- Retention: 14 days (configurable)

### CloudWatch Metrics
Monitor these key metrics:
- ECS service CPU/Memory utilization
- ALB request count and latency
- DocumentDB connections and performance

### Health Checks
- **Application**: `GET /api/health`
- **Load Balancer**: HTTP health check on port 5000
- **ECS**: Container health check with 30s interval

## Scaling Configuration

### Auto Scaling
```bash
# Create auto scaling target
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --resource-id service/exam-system-cluster/exam-system-service \
    --scalable-dimension ecs:service:DesiredCount \
    --min-capacity 2 \
    --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
    --service-namespace ecs \
    --resource-id service/exam-system-cluster/exam-system-service \
    --scalable-dimension ecs:service:DesiredCount \
    --policy-name exam-system-scaling-policy \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## Security Best Practices

### Network Security
- VPC with public and private subnets
- Security groups with minimal required access
- DocumentDB in private subnets only

### Application Security
- Non-root container user
- Secrets stored in AWS Secrets Manager
- Environment variables for configuration
- Regular security updates

### Access Control
- IAM roles with least privilege
- ECS task roles for AWS service access
- No hardcoded credentials

## Cost Optimization

### Resource Sizing
- **ECS Tasks**: Start with 1 vCPU, 2GB RAM
- **DocumentDB**: Use `db.t3.medium` for development
- **Load Balancer**: Application Load Balancer (cheaper than Network LB)

### Cost Monitoring
- Set up billing alerts
- Use AWS Cost Explorer
- Consider Reserved Instances for production

## Troubleshooting

### Common Issues

#### 1. ECS Service Won't Start
```bash
# Check service events
aws ecs describe-services \
    --cluster exam-system-cluster \
    --services exam-system-service

# Check task logs
aws logs get-log-events \
    --log-group-name /ecs/exam-system \
    --log-stream-name ecs/exam-app/TASK_ID
```

#### 2. Database Connection Issues
- Verify security group rules
- Check DocumentDB endpoint in Secrets Manager
- Ensure SSL is enabled in connection string

#### 3. Load Balancer Health Check Failures
- Verify application is listening on port 5000
- Check `/api/health` endpoint returns 200
- Review security group rules

### Useful Commands

```bash
# View stack outputs
aws cloudformation describe-stacks \
    --stack-name exam-system-infrastructure \
    --query 'Stacks[0].Outputs'

# Check ECS service status
aws ecs describe-services \
    --cluster exam-system-cluster \
    --services exam-system-service

# View application logs
aws logs tail /ecs/exam-system --follow

# Update ECS service
aws ecs update-service \
    --cluster exam-system-cluster \
    --service exam-system-service \
    --desired-count 3
```

## Backup and Disaster Recovery

### Database Backups
- Automated daily backups (7-day retention)
- Manual snapshots before major updates
- Cross-region backup replication for production

### Application Backups
- ECR image versioning
- CloudFormation template version control
- Configuration backup in version control

## Production Checklist

- [ ] SSL certificate configured
- [ ] Custom domain name set up
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] Security groups reviewed
- [ ] Auto scaling configured
- [ ] Cost monitoring set up
- [ ] Documentation updated
- [ ] Team access configured
- [ ] Disaster recovery plan created

## Support and Maintenance

### Regular Tasks
- Monitor application performance
- Review security updates
- Update Docker images
- Review and optimize costs
- Test backup and recovery procedures

### Updates and Deployments
Use the deployment scripts for consistent updates:
```bash
# Deploy application updates only
./scripts/deploy.sh app

# Deploy infrastructure changes only
./scripts/deploy.sh infra
```

## Getting Help

If you encounter issues:
1. Check the troubleshooting section
2. Review CloudWatch logs
3. Verify AWS service limits
4. Check AWS service health dashboard
5. Contact AWS support if needed

---

**Note**: Replace placeholder values (account IDs, regions, passwords) with your actual values before deployment.
